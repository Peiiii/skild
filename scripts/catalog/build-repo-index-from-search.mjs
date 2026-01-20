#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

function parseIntArg(flag, fallback, min = 0, max = Number.POSITIVE_INFINITY) {
  const raw = getArg(flag, String(fallback));
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const query = getArg('--query', 'filename:SKILL.md');
const pages = parseIntArg('--pages', 10, 1, 50);
const perPage = parseIntArg('--per-page', 100, 1, 100);
const partSize = parseIntArg('--part-size', 1000, 1, 5000);
const date = getArg('--date', new Date().toISOString().slice(0, 10));
const outRoot = path.resolve(process.cwd(), getArg('--out', 'data/repo-index'));
const outDir = path.join(outRoot, date);

function headers() {
  const base = { Accept: 'application/vnd.github+json', 'User-Agent': 'skild-repo-index' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function fetchSearch(page) {
  const url = new URL('https://api.github.com/search/code');
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub search ${res.status}: ${text}`);
  }
  return res.json();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePart(index, data) {
  const name = `part-${String(index).padStart(4, '0')}.json`;
  const target = path.join(outDir, name);
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
  return target;
}

async function main() {
  if (!token) {
    console.warn('[repo-index] GITHUB_TOKEN not set. API rate limits will be very low.');
  }

  ensureDir(outDir);

  const seen = new Set();
  let partIndex = 1;
  let buffer = [];
  let total = 0;

  for (let page = 1; page <= pages; page += 1) {
    const payload = await fetchSearch(page);
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length === 0) break;

    for (const item of items) {
      const repo = item?.repository;
      if (!repo?.full_name) continue;
      if (seen.has(repo.full_name)) continue;
      seen.add(repo.full_name);
      buffer.push({
        repo: repo.full_name,
        default_branch: repo.default_branch || 'main',
        stars_total: repo.stargazers_count ?? null,
        forks_total: repo.forks_count ?? null,
        updated_at: repo.updated_at ?? null,
        pushed_at: repo.pushed_at ?? null,
        created_at: repo.created_at ?? null,
        description: repo.description ?? null,
        homepage: repo.homepage ?? null,
        license_spdx: repo.license?.spdx_id ?? null,
        source_type: 'github',
        source_url: repo.html_url ?? null,
      });
      total += 1;

      if (buffer.length >= partSize) {
        const target = writePart(partIndex, buffer);
        console.log(`[repo-index] wrote ${buffer.length} repos -> ${target}`);
        buffer = [];
        partIndex += 1;
      }
    }
  }

  if (buffer.length > 0) {
    const target = writePart(partIndex, buffer);
    console.log(`[repo-index] wrote ${buffer.length} repos -> ${target}`);
  }

  const state = {
    date,
    outDir,
    total,
    query,
    pages,
    perPage,
  };
  const statePath = path.join(outDir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  console.log(`[repo-index] done (${total} repos).`);
}

main().catch((err) => {
  console.error('[repo-index] failed:', err);
  process.exit(1);
});
