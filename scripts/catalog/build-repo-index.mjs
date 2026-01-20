#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

function parseIntArg(flag, fallback) {
  const raw = getArg(flag, String(fallback));
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return value;
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const limit = parseIntArg('--limit', 1000);
const partSize = parseIntArg('--part-size', 1000);
const since = parseIntArg('--since', 0);
const date = getArg('--date', new Date().toISOString().slice(0, 10));
const outRoot = path.resolve(process.cwd(), getArg('--out', 'data/repo-index'));
const outDir = path.join(outRoot, date);

function headers() {
  const base = { Accept: 'application/vnd.github+json', 'User-Agent': 'skild-repo-index' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function fetchPage(sinceId) {
  const url = new URL('https://api.github.com/repositories');
  url.searchParams.set('since', String(sinceId));
  url.searchParams.set('per_page', '100');
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
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
  let fetched = 0;
  let partIndex = 1;
  let buffer = [];
  let cursor = since;

  while (fetched < limit) {
    const page = await fetchPage(cursor);
    if (!Array.isArray(page) || page.length === 0) break;

    for (const repo of page) {
      if (fetched >= limit) break;
      if (!repo || !repo.full_name) continue;
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
      fetched += 1;
      cursor = repo.id;

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
    total: fetched,
    nextSince: cursor,
  };
  const statePath = path.join(outDir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  console.log(`[repo-index] done (${fetched} repos). Next since: ${cursor}`);
}

main().catch((err) => {
  console.error('[repo-index] failed:', err);
  process.exit(1);
});
