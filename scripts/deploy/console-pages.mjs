import { spawnSync } from 'node:child_process';
import path from 'node:path';

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    ...options
  });
  if (result.status !== 0) {
    const joined = [cmd, ...args].join(' ');
    throw new Error(`Command failed (${result.status}): ${joined}`);
  }
}

function tryRunQuiet(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

const projectName = process.env.SKILD_CONSOLE_PAGES_PROJECT?.trim() || 'skild-console';
const productionBranch = process.env.SKILD_CONSOLE_PAGES_BRANCH?.trim() || 'main';
const distDir = path.resolve(process.cwd(), 'apps/console/dist');
const rootDir = process.cwd();

// 1) Build console
run('pnpm', ['-C', 'apps/console', 'build']);

// 2) Ensure Pages project exists (idempotent-ish: create may fail if already exists)
tryRunQuiet('pnpm', [
  '-C',
  'workers/registry',
  'exec',
  'wrangler',
  '--cwd',
  rootDir,
  'pages',
  'project',
  'create',
  projectName,
  '--production-branch',
  productionBranch
]);

// 3) Deploy static assets
run('pnpm', [
  '-C',
  'workers/registry',
  'exec',
  'wrangler',
  '--cwd',
  rootDir,
  'pages',
  'deploy',
  distDir,
  '--project-name',
  projectName,
  '--branch',
  productionBranch,
  '--commit-dirty=true'
]);
