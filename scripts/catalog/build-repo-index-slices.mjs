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

function parseDate(input) {
  const value = (input || '').trim();
  if (!value) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const baseQuery = getArg('--query', 'filename:SKILL.md');
const mode = getArg('--mode', 'size');
const sliceDays = parseIntArg('--slice-days', 90, 1, 365);
const perPage = parseIntArg('--per-page', 100, 1, 100);
const maxPages = parseIntArg('--max-pages', 10, 1, 10);
const partSize = parseIntArg('--part-size', 1000, 1, 5000);
const delayMs = parseIntArg('--delay-ms', 1200, 0, 10_000);
const sizeMin = parseIntArg('--size-min', 0, 0, 200000);
const sizeMax = parseIntArg('--size-max', 50000, 1, 200000);
const date = getArg('--date', new Date().toISOString().slice(0, 10));
const outRoot = path.resolve(process.cwd(), getArg('--out', 'data/repo-index'));
const startDateInput = getArg('--start', '');
const endDateInput = getArg('--end', '');

const startDate = parseDate(startDateInput) || new Date(Date.UTC(2020, 0, 1));
const endDate = parseDate(endDateInput) || new Date();

function headers() {
  const base = { Accept: 'application/vnd.github+json', 'User-Agent': 'skild-repo-index' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

async function fetchSearch(query, page, perPageOverride) {
  const url = new URL('https://api.github.com/search/code');
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', String(perPageOverride ?? perPage));
  url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { headers: headers() });
  if (res.status === 403) {
    const resetHeader = res.headers.get('x-ratelimit-reset');
    const resetAt = resetHeader ? Number.parseInt(resetHeader, 10) * 1000 : 0;
    if (resetAt) {
      const waitMs = Math.max(resetAt - Date.now(), 0) + 1500;
      console.warn(`[repo-index] rate limited, waiting ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      return fetchSearch(query, page);
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub search ${res.status}: ${text}`);
  }
  return res.json();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePart(outDir, index, data) {
  const name = `part-${String(index).padStart(4, '0')}.json`;
  const target = path.join(outDir, name);
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
  return target;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!token) {
    console.warn('[repo-index] GITHUB_TOKEN not set. API rate limits will be very low.');
  }

  const outDir = path.join(outRoot, date);
  ensureDir(outDir);

  const seen = new Set();
  let partIndex = 1;
  let buffer = [];
  let total = 0;
  const slices = [];

  const existingParts = fs
    .readdirSync(outDir)
    .filter(name => name.startsWith('part-') && name.endsWith('.json'));
  if (existingParts.length > 0) {
    let maxIndex = 0;
    for (const name of existingParts) {
      const match = name.match(/^part-(\d+)\.json$/);
      if (match) {
        const value = Number.parseInt(match[1], 10);
        if (Number.isFinite(value)) maxIndex = Math.max(maxIndex, value);
      }
      const data = JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item.repo === 'string') seen.add(item.repo);
        }
      }
    }
    partIndex = maxIndex + 1;
    total = seen.size;
  }

  async function fetchTotalCount(query) {
    const payload = await fetchSearch(query, 1, 1);
    return Number(payload.total_count || 0);
  }

  async function collectFromQuery(query, label) {
    for (let page = 1; page <= maxPages; page += 1) {
      const payload = await fetchSearch(query, page);
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
          const target = writePart(outDir, partIndex, buffer);
          console.log(`[repo-index] wrote ${buffer.length} repos -> ${target}`);
          buffer = [];
          partIndex += 1;
        }
      }

      if (delayMs > 0) await sleep(delayMs);
    }
    if (label) slices.push(label);
  }

  async function splitSizeRange(start, end) {
    const range = `${start}..${end}`;
    const query = `${baseQuery} size:${range}`;
    const totalCount = await fetchTotalCount(query);
    if (totalCount > 1000 && end > start) {
      const mid = Math.floor((start + end) / 2);
      if (mid === start) {
        await collectFromQuery(query, range);
        return;
      }
      await splitSizeRange(start, mid);
      await splitSizeRange(mid + 1, end);
      return;
    }
    await collectFromQuery(query, range);
  }

  if (mode === 'pushed') {
    let cursor = new Date(startDate);
    while (cursor < endDate) {
      const sliceStart = new Date(cursor);
      const sliceEnd = addDays(sliceStart, sliceDays);
      if (sliceEnd > endDate) sliceEnd.setTime(endDate.getTime());
      const range = `${formatDate(sliceStart)}..${formatDate(sliceEnd)}`;
      const query = `${baseQuery} pushed:${range}`;
      await collectFromQuery(query, range);
      cursor = addDays(sliceEnd, 1);
    }
  } else {
    await splitSizeRange(sizeMin, sizeMax);
  }

  if (buffer.length > 0) {
    const target = writePart(outDir, partIndex, buffer);
    console.log(`[repo-index] wrote ${buffer.length} repos -> ${target}`);
  }

  const state = {
    date,
    outDir,
    total,
    slices,
    baseQuery,
    sliceDays,
    perPage,
    maxPages,
  };
  const statePath = path.join(outDir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  console.log(`[repo-index] done (${total} repos).`);
}

main().catch((err) => {
  console.error('[repo-index] failed:', err);
  process.exit(1);
});
