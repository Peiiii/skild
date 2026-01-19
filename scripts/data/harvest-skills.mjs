#!/usr/bin/env node
/**
 * Harvest skills/skillsets from the Skild registry and GitHub code search,
 * writing a normalized JSON snapshot to disk. Designed for repeatable,
 * automatable data pulls to feed curation/leaderboards.
 *
 * Usage:
 *   OUT=data/skills-harvest.json GITHUB_TOKEN=xxxx node scripts/data/harvest-skills.mjs
 *
 * Env vars:
 *   - SKILD_REGISTRY: override registry base URL (default https://registry.skild.sh)
 *   - OUT: output file path (default data/skills-harvest.json)
 *   - GITHUB_TOKEN/GH_TOKEN: optional, increases GitHub rate limits
 *   - GITHUB_QUERY: override code search query (default: filename:SKILL.md path:skills)
 *   - GITHUB_PAGES: max GitHub result pages (default: 3, 100 results per page)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const registryBase = process.env.SKILD_REGISTRY || 'https://registry.skild.sh';
const outPath = path.resolve(process.cwd(), process.env.OUT || 'data/skills-harvest.json');
const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
const githubQuery = process.env.GITHUB_QUERY || 'filename:SKILL.md path:skills';
const githubPages = Number.parseInt(process.env.GITHUB_PAGES || '3', 10);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}\n${text}`);
  }
  return res.json();
}

async function fetchRegistryPage(cursor, skillsetFlag) {
  const url = new URL(`${registryBase}/discover`);
  url.searchParams.set('limit', '100');
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('skillset', skillsetFlag ? '1' : '0');
  if (cursor) url.searchParams.set('cursor', cursor);
  return fetchJson(url.toString());
}

async function fetchAllRegistry(skillsetFlag) {
  const items = [];
  let cursor = null;
  while (true) {
    const page = await fetchRegistryPage(cursor, skillsetFlag);
    const rows = page.items || page.rows || [];
    for (const item of rows) {
      items.push({
        source: 'registry',
        type: item.skillset ? 'skillset' : 'skill',
        name: item.sourceId || item.title,
        title: item.title,
        description: item.description,
        install: item.install,
        alias: item.alias || null,
        tags: item.tags || [],
        publisherHandle: item.publisherHandle || null,
        skillset: Boolean(item.skillset),
        sourceRepo: item.source?.repo || null,
        sourcePath: item.source?.path || null,
        sourceRef: item.source?.ref || null,
        sourceUrl: item.source?.url || null,
        starsTotal: item.starsTotal ?? null,
        stars30d: item.stars30d ?? null,
        downloadsTotal: item.downloadsTotal ?? null,
        downloads7d: item.downloads7d ?? null,
        downloads30d: item.downloads30d ?? null,
        updatedAt: item.updatedAt,
        discoverAt: item.discoverAt,
      });
    }
    cursor = page.cursor || page.nextCursor || null;
    if (!cursor) break;
  }
  return items;
}

function githubHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  return headers;
}

async function fetchGithubCodeSearch() {
  if (!githubToken) {
    console.warn('[harvest] GITHUB_TOKEN not set, skipping GitHub code search.');
    return [];
  }
  const perPage = 100;
  const maxPages = Number.isFinite(githubPages) && githubPages > 0 ? githubPages : 3;
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL('https://api.github.com/search/code');
    url.searchParams.set('q', githubQuery);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    const data = await fetchJson(url.toString(), githubHeaders());
    if (!data.items || data.items.length === 0) break;
    items.push(...data.items);
    if (data.items.length < perPage) break;
  }

  return items;
}

async function fetchGithubReposMeta(repos) {
  if (!githubToken || repos.size === 0) return new Map();
  const headers = githubHeaders();
  const results = new Map();
  const queue = [...repos];
  const concurrency = 5;

  async function worker() {
    while (queue.length > 0) {
      const repo = queue.shift();
      if (!repo) continue;
      const url = `https://api.github.com/repos/${repo}`;
      try {
        const data = await fetchJson(url, headers);
        results.set(repo, {
          stars: data.stargazers_count ?? null,
          updatedAt: data.pushed_at ?? data.updated_at ?? null,
          defaultBranch: data.default_branch || 'main',
          description: data.description || '',
          htmlUrl: data.html_url,
        });
      } catch (error) {
        console.error(`[github] failed to fetch repo ${repo}: ${error.message}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

function normalizeGithubItems(codeItems, repoMeta) {
  const results = [];
  for (const item of codeItems) {
    const repoFull = item.repository?.full_name;
    const meta = repoMeta.get(repoFull);
    const pathParts = (item.path || '').split('/');
    const dir = pathParts.slice(0, -1).join('/');
    const installPath = dir ? `/${dir}` : '';
    const branch = meta?.defaultBranch || 'main';
    results.push({
      source: 'github',
      type: 'skill',
      name: `${repoFull}${installPath ? `:${installPath}` : ''}`,
      title: item.name || 'SKILL',
      description: meta?.description || '',
      install: `skild install https://github.com/${repoFull}/tree/${branch}${installPath}`,
      alias: null,
      tags: [],
      publisherHandle: null,
      skillset: false,
      sourceRepo: repoFull,
      sourcePath: installPath || null,
      sourceRef: branch,
      sourceUrl: item.html_url,
      starsTotal: meta?.stars ?? null,
      stars30d: null,
      downloadsTotal: null,
      downloads7d: null,
      downloads30d: null,
      updatedAt: meta?.updatedAt || null,
      discoverAt: new Date().toISOString(),
    });
  }
  return results;
}

async function main() {
  const startedAt = Date.now();
  console.log('[harvest] fetching registry skills...');
  const registrySkills = await fetchAllRegistry(false);
  console.log(`[harvest] registry skills: ${registrySkills.length}`);

  console.log('[harvest] fetching registry skillsets...');
  const registrySkillsets = await fetchAllRegistry(true);
  console.log(`[harvest] registry skillsets: ${registrySkillsets.length}`);

  console.log('[harvest] GitHub code search...');
  let githubSkills = [];
  try {
    const ghCodeItems = await fetchGithubCodeSearch();
    const uniqueRepos = new Set(ghCodeItems.map((i) => i.repository?.full_name).filter(Boolean));
    console.log(`[harvest] GitHub code results: ${ghCodeItems.length}, repos: ${uniqueRepos.size}`);
    const repoMeta = await fetchGithubReposMeta(uniqueRepos);
    githubSkills = normalizeGithubItems(ghCodeItems, repoMeta);
  } catch (error) {
    console.error('[harvest] GitHub search failed, continuing without GitHub data:', error.message);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    registryBase,
    githubQuery,
    counts: {
      registrySkills: registrySkills.length,
      registrySkillsets: registrySkillsets.length,
      githubSkills: githubSkills.length,
    },
    items: [...registrySkills, ...registrySkillsets, ...githubSkills],
  };

  ensureDir(outPath);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[harvest] done in ${seconds}s → ${outPath}`);
}

main().catch((error) => {
  console.error('[harvest] failed:', error);
  process.exit(1);
});
