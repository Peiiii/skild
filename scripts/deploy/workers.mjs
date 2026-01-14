import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    const joined = [cmd, ...args].join(' ');
    throw new Error(`Command failed (${result.status}): ${joined}`);
  }
}

function parseArgs(argv) {
  const args = { dryRun: false, only: null, smoke: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--only') args.only = String(argv[i + 1] || '').trim() || null;
    else if (a === '--no-smoke') args.smoke = false;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/deploy/workers.mjs [--dry-run] [--only <workerName>] [--no-smoke]');
      process.exit(0);
    }
  }
  return args;
}

function listWorkerDirs(rootDir) {
  const workersRoot = path.join(rootDir, 'workers');
  if (!fs.existsSync(workersRoot)) return [];
  return fs
    .readdirSync(workersRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(workersRoot, d.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'wrangler.toml')));
}

function getWorkerNameFromWranglerToml(tomlText, fallbackDirName) {
  const m = tomlText.match(/^\s*name\s*=\s*"(.*?)"\s*$/m);
  return m?.[1]?.trim() || fallbackDirName;
}

function getD1DatabaseNames(tomlText) {
  const names = new Set();
  const lines = tomlText.split('\n');
  let inD1 = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('[[') && line.endsWith(']]')) {
      inD1 = line === '[[d1_databases]]';
      continue;
    }
    if (!inD1) continue;
    const m = line.match(/^database_name\s*=\s*"(.*?)"\s*$/);
    if (m?.[1]) names.add(m[1].trim());
  }
  return Array.from(names);
}

function getRouteHosts(tomlText) {
  const hosts = new Set();
  const re = /pattern\s*=\s*"(.*?)"/g;
  for (;;) {
    const m = re.exec(tomlText);
    if (!m) break;
    const pattern = String(m[1] || '').trim();
    if (!pattern) continue;
    const withoutScheme = pattern.replace(/^https?:\/\//, '');
    const host = withoutScheme.split('/')[0]?.trim();
    if (host) hosts.add(host);
  }
  return Array.from(hosts);
}

function formatCmd(cmd, args) {
  return [cmd, ...args].join(' ');
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, json: text ? JSON.parse(text) : null };
  } finally {
    clearTimeout(t);
  }
}

async function smokeHealth(host, { attempts = 10 } = {}) {
  const url = `https://${host}/health`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchJsonWithTimeout(url, 10_000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.json || res.json.ok !== true) throw new Error(`Unexpected response: ${res.text.slice(0, 200)}`);
      return;
    } catch (e) {
      if (i === attempts - 1) throw new Error(`[deploy:workers] smoke failed: ${url} (${e instanceof Error ? e.message : String(e)})`);
      const delay = Math.min(5000, 500 * Math.pow(1.4, i));
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function main() {
  const { dryRun, only, smoke } = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();

  const workerDirs = listWorkerDirs(rootDir);
  if (workerDirs.length === 0) throw new Error('No workers found under ./workers/* with a wrangler.toml');

  const selected = [];
  for (const dir of workerDirs) {
    const tomlPath = path.join(dir, 'wrangler.toml');
    const tomlText = fs.readFileSync(tomlPath, 'utf8');
    const dirName = path.basename(dir);
    const workerName = getWorkerNameFromWranglerToml(tomlText, dirName);
    if (only && workerName !== only && dirName !== only) continue;
    selected.push({ dir, dirName, workerName, tomlText });
  }

  if (selected.length === 0) {
    const hint = only ? ` (requested --only ${only})` : '';
    throw new Error(`No matching workers found${hint}.`);
  }

  for (const w of selected) {
    const d1Names = getD1DatabaseNames(w.tomlText);
    const routeHosts = getRouteHosts(w.tomlText);

    console.log(`\n[deploy:workers] worker=${w.workerName} dir=${path.relative(rootDir, w.dir)}`);

    for (const db of d1Names) {
      const args = ['-C', path.relative(rootDir, w.dir), 'exec', 'wrangler', 'd1', 'migrations', 'apply', db, '--remote'];
      if (dryRun) console.log(`[dry-run] ${formatCmd('pnpm', args)}`);
      else run('pnpm', args, { cwd: rootDir });
    }

    const deployArgs = ['-C', path.relative(rootDir, w.dir), 'exec', 'wrangler', 'deploy'];
    if (dryRun) console.log(`[dry-run] ${formatCmd('pnpm', deployArgs)}`);
    else run('pnpm', deployArgs, { cwd: rootDir });

    if (smoke && routeHosts.length > 0) {
      for (const host of routeHosts) {
        const url = `https://${host}/health`;
        if (dryRun) {
          console.log(`[dry-run] smoke: GET ${url}`);
        } else {
          await smokeHealth(host);
          console.log(`[deploy:workers] smoke ok: ${url}`);
        }
      }
    }
  }
}

await main();
