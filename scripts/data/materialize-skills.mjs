#!/usr/bin/env node
/**
 * Materialize harvested skills into a directory tree with metadata + SKILL.md.
 *
 * Input: data/skills-harvest.json (from harvest-skills.mjs)
 * Output: data/skills/<slug>/{meta.json,SKILL.md?}
 *
 * Usage:
 *   GITHUB_TOKEN=xxx node scripts/data/materialize-skills.mjs
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const harvestPath = path.join(root, 'data', 'skills-harvest.json');
const outDir = path.join(root, 'data', 'skills');
const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
const registryBase = process.env.SKILD_REGISTRY || 'https://registry.skild.sh';

function slugify(input) {
  return input
    .replace(/[^\w./-]+/g, '_')
    .replace(/[\\/]/g, '__')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fetch failed ${res.status} ${res.statusText} for ${url}\n${text}`);
  }
  return res.text();
}

async function fetchGithubSkill(item) {
  const repo = item.sourceRepo;
  const branch = item.sourceRef || 'main';
  const pathPart = item.sourcePath ? item.sourcePath.replace(/^\/+/, '') : '';
  const fullPath = pathPart ? `${pathPart}/SKILL.md` : 'SKILL.md';
  const headers = githubToken ? { Authorization: `Bearer ${githubToken}` } : {};

  // Try branch -> master fallback
  const candidates = [
    `https://raw.githubusercontent.com/${repo}/${branch}/${fullPath}`,
    `https://raw.githubusercontent.com/${repo}/master/${fullPath}`,
  ];

  for (const url of candidates) {
    try {
      return await fetchText(url, headers);
    } catch (error) {
      // Continue to next candidate
    }
  }
  throw new Error(`SKILL.md not found for ${repo}/${fullPath}`);
}

async function fetchRegistrySkill(item) {
  // item.name is like "@scope/skill"
  const canonical = item.name.trim();
  const stripped = canonical.startsWith('@') ? canonical.slice(1) : canonical;
  const [scope, skill] = stripped.split('/');
  if (!scope || !skill) throw new Error(`Invalid registry name: ${canonical}`);

  const metaUrl = `${registryBase}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) {
    const text = await metaRes.text();
    throw new Error(`Failed to load registry meta for ${canonical}: ${metaRes.status} ${text}`);
  }
  const meta = await metaRes.json();
  const distTags = meta.distTags || [];
  const latest = distTags.find((d) => d.tag === 'latest') || distTags[0];
  const version = latest?.version;
  if (!version) throw new Error(`No version found for ${canonical}`);

  const tarUrl = `${registryBase}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}/versions/${encodeURIComponent(version)}/tarball`;
  const tarRes = await fetch(tarUrl);
  if (!tarRes.ok) {
    const text = await tarRes.text();
    throw new Error(`Failed to download tarball ${canonical}@${version}: ${tarRes.status} ${text}`);
  }
  const buf = Buffer.from(await tarRes.arrayBuffer());
  const tmpFile = path.join(os.tmpdir(), `${scope}__${skill}__${version}.tgz`);
  fs.writeFileSync(tmpFile, buf);

  try {
    const list = execSync(`tar -tf "${tmpFile}"`, { encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const skillPath = list.find((f) => /(^|\/)SKILL\.md$/i.test(f));
    if (!skillPath) throw new Error('SKILL.md not found in tarball');
    const content = execSync(`tar -xOf "${tmpFile}" "${skillPath}"`, { encoding: 'utf8' });
    return content;
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

async function main() {
  const harvest = JSON.parse(fs.readFileSync(harvestPath, 'utf8'));
  const items = harvest.items || [];
  ensureCleanDir(outDir);

  const errors = [];
  for (const item of items) {
    const slug = slugify(item.name || item.install || item.sourceRepo || `item-${Math.random().toString(36).slice(2)}`);
    const dir = path.join(outDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(item, null, 2), 'utf8');

    try {
      let content = null;
      if (item.sourceRepo) {
        content = await fetchGithubSkill(item);
      } else if (item.name?.startsWith('@')) {
        content = await fetchRegistrySkill(item);
      }
      if (content) {
        fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf8');
      }
    } catch (error) {
      errors.push({ slug, error: error.message });
      fs.writeFileSync(path.join(dir, 'error.txt'), String(error.message), 'utf8');
    }
  }

  if (errors.length) {
    console.error(`[materialize] completed with ${errors.length} errors (see data/skills/*/error.txt)`);
  } else {
    console.log('[materialize] completed successfully.');
  }
}

main().catch((error) => {
  console.error('[materialize] failed:', error);
  process.exit(1);
});
