import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';
import chalk from 'chalk';
import { SkildError, validateSkillDir } from '@skild/core';
import { createSpinner } from '../utils/logger.js';

export interface PushCommandOptions {
  dir?: string;
  path?: string;
  branch?: string;
  message?: string;
  local?: boolean;
}

function expandHome(input: string): string {
  if (!input.startsWith('~')) return input;
  return path.join(os.homedir(), input.slice(1));
}

function isExplicitLocalSpec(input: string): boolean {
  return input.startsWith('.') || input.startsWith('/') || input.startsWith('~') || input.startsWith('file://');
}

function resolveRepoSource(raw: string, preferLocal: boolean): { url: string; label: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new SkildError('INVALID_SOURCE', 'Missing repo. Provide a Git URL, local path, or owner/repo.');
  }

  if (preferLocal || isExplicitLocalSpec(trimmed)) {
    if (trimmed.startsWith('file://')) {
      return { url: trimmed, label: trimmed };
    }
    const expanded = expandHome(trimmed);
    const resolved = path.resolve(expanded);
    if (!fs.existsSync(resolved)) {
      throw new SkildError('INVALID_SOURCE', `Local repo not found: ${resolved}`);
    }
    return { url: resolved, label: resolved };
  }

  if (/^[^/]+\/[^/]+$/.test(trimmed) && !trimmed.includes(':') && !trimmed.startsWith('http')) {
    const preferSsh = hasSshAgentKeys() || Boolean(process.env.GIT_SSH_COMMAND);
    const url = preferSsh ? `git@github.com:${trimmed}.git` : `https://github.com/${trimmed}.git`;
    return { url, label: trimmed };
  }

  if (/^(https?:|git@|ssh:)/i.test(trimmed) || trimmed.includes('github.com') || trimmed.includes('gitlab.com')) {
    return { url: trimmed, label: trimmed };
  }

  throw new SkildError(
    'INVALID_SOURCE',
    `Unsupported repo "${raw}". Use owner/repo, a Git URL, or pass --local for a local path.`
  );
}

function hasSshAgentKeys(): boolean {
  if (!process.env.SSH_AUTH_SOCK) return false;
  try {
    const out = execSync('ssh-add -L', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return /ssh-(rsa|ed25519)|ecdsa-/.test(out);
  } catch {
    return false;
  }
}

function normalizeSkillSegment(name: string, fallback: string): string {
  const base = name.replace(/^@/, '').trim();
  const segment = base.includes('/') ? base.split('/').pop() || '' : base;
  const sanitized = segment.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (sanitized) return sanitized;
  const fallbackSanitized = fallback.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return fallbackSanitized || 'skill';
}

function normalizeTargetPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '.' || trimmed === './') {
    throw new SkildError('INVALID_SOURCE', 'Target path cannot be repo root; provide a subdirectory.');
  }
  const normalized = path.posix.normalize(trimmed.replace(/\\/g, '/')).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('..')) {
    throw new SkildError('INVALID_SOURCE', 'Target path must stay within the repo.');
  }
  return normalized.replace(/\/+$/, '');
}

function resolveTargetAbs(repoRoot: string, targetRel: string): string {
  const root = path.resolve(repoRoot);
  const targetAbs = path.resolve(root, targetRel);
  if (!targetAbs.startsWith(`${root}${path.sep}`)) {
    throw new SkildError('INVALID_SOURCE', 'Target path escapes repo root.');
  }
  return targetAbs;
}

function copySkillDir(src: string, dest: string): void {
  const blocked = new Set(['.git', '.skild', 'node_modules', '.DS_Store']);
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (source: string) => {
      const base = path.basename(source);
      if (blocked.has(base)) return false;
      return true;
    }
  });
}

async function hasHeadCommit(git: ReturnType<typeof simpleGit>): Promise<boolean> {
  try {
    await git.revparse(['--verify', 'HEAD']);
    return true;
  } catch {
    return false;
  }
}

async function ensureBranch(
  git: ReturnType<typeof simpleGit>,
  requested?: string
): Promise<{ branch: string; setUpstream: boolean }> {
  const branchName = requested?.trim() || '';
  const hasHead = await hasHeadCommit(git);

  if (!hasHead) {
    const target = branchName || 'main';
    await git.checkoutLocalBranch(target);
    return { branch: target, setUpstream: true };
  }

  if (branchName) {
    const branches = await git.branch(['-a']);
    if (branches.all.includes(`remotes/origin/${branchName}`) || branches.all.includes(branchName)) {
      await git.checkout(branchName);
    } else {
      await git.checkoutLocalBranch(branchName);
    }
    return { branch: branchName, setUpstream: true };
  }

  const current = await git.branchLocal();
  return { branch: current.current || 'main', setUpstream: false };
}

function buildCommitMessage(name: string, version?: string | null): string {
  const v = version?.trim();
  return v ? `skild push: ${name}@${v}` : `skild push: ${name}`;
}

export async function push(repo: string, options: PushCommandOptions = {}): Promise<void> {
  let repoSpec = repo.trim();
  let requestedBranch = options.branch;
  const hashIndex = repoSpec.indexOf('#');
  if (hashIndex !== -1) {
    const base = repoSpec.slice(0, hashIndex);
    const ref = repoSpec.slice(hashIndex + 1).trim();
    if (ref && !requestedBranch) requestedBranch = ref;
    repoSpec = base;
  }

  const { url, label } = resolveRepoSource(repoSpec, Boolean(options.local));
  const dir = path.resolve(options.dir || process.cwd());
  const validation = validateSkillDir(dir);

  if (!validation.ok) {
    console.error(chalk.red('Skill validation failed:'));
    for (const issue of validation.issues) console.error(chalk.red(`- ${issue.message}`));
    process.exitCode = 1;
    return;
  }

  const frontmatter = validation.frontmatter!;
  const skillName = String(frontmatter.name || path.basename(dir) || 'skill');
  const fallback = path.basename(dir) || 'skill';
  const defaultTarget = `skills/${normalizeSkillSegment(skillName, fallback)}`;
  const targetRel = normalizeTargetPath(options.path || defaultTarget);

  const spinner = createSpinner(`Preparing ${chalk.cyan(skillName)}...`);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skild-push-'));

  try {
    spinner.text = `Cloning ${chalk.cyan(label)}...`;
    await simpleGit().clone(url, tempRoot);

    const repoGit = simpleGit(tempRoot);
    const { branch, setUpstream } = await ensureBranch(repoGit, requestedBranch);

    spinner.text = `Updating ${chalk.cyan(targetRel)}...`;
    const targetAbs = resolveTargetAbs(tempRoot, targetRel);
    if (fs.existsSync(targetAbs)) fs.rmSync(targetAbs, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
    copySkillDir(dir, targetAbs);

    await repoGit.add(['-A', targetRel]);
    const status = await repoGit.status();
    if (status.isClean()) {
      spinner.succeed(`No changes to push for ${chalk.green(skillName)}.`);
      return;
    }

    spinner.text = 'Committing changes...';
    const message = options.message?.trim() || buildCommitMessage(skillName, frontmatter.version as string | undefined);
    await repoGit.commit(message);

    spinner.text = 'Pushing to remote...';
    if (setUpstream) {
      await repoGit.push(['-u', 'origin', branch]);
    } else {
      await repoGit.push();
    }

    spinner.succeed(`Pushed ${chalk.green(skillName)} to ${chalk.cyan(label)}:${chalk.cyan(targetRel)}`);
  } catch (error: unknown) {
    spinner.fail('Push failed');
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
