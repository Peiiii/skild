import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import * as tar from 'tar';
import chalk from 'chalk';
import { loadRegistryAuth, SkildError, splitCanonicalName, validateSkillDir } from '@skild/core';
import { createSpinner } from '../utils/logger.js';

export interface PublishCommandOptions {
  dir?: string;
  name?: string;
  skillVersion?: string;
  description?: string;
  targets?: string;
  tag?: string;
  registry?: string;
  json?: boolean;
}

function sha256Hex(buf: Buffer): string {
  const h = crypto.createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

function parseTargets(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export async function publish(options: PublishCommandOptions = {}): Promise<void> {
  const auth = loadRegistryAuth();
  const registry = (options.registry || auth?.registryUrl || '').trim().replace(/\/+$/, '');
  const token = auth?.token;

  if (!registry) {
    console.error(chalk.red('Missing registry URL. Use --registry <url> or run `skild login --registry <url> ...`.'));
    process.exitCode = 1;
    return;
  }
  if (!token) {
    console.error(chalk.red('Not logged in. Run `skild login --registry <url> ...` first.'));
    process.exitCode = 1;
    return;
  }

  const dir = path.resolve(options.dir || process.cwd());
  const validation = validateSkillDir(dir);
  if (!validation.ok) {
    console.error(chalk.red('Skill validation failed:'));
    for (const issue of validation.issues) console.error(chalk.red(`- ${issue.message}`));
    process.exitCode = 1;
    return;
  }

  const fm = validation.frontmatter!;
  const name = (options.name || fm.name || '').trim();
  const version = (options.skillVersion || fm.version || '').trim();
  const description = (options.description || fm.description || '').trim();
  const tag = (options.tag || 'latest').trim() || 'latest';
  const targets = parseTargets(options.targets);

  if (!/^@[a-z0-9][a-z0-9-]{1,31}\/[a-z0-9][a-z0-9-]{1,63}$/.test(name)) {
    console.error(chalk.red('Invalid publish name. Expected @publisher/skill (lowercase letters/digits/dashes).'));
    process.exitCode = 1;
    return;
  }
  if (!version) {
    console.error(chalk.red('Missing version. Provide semver like 1.2.3 via SKILL.md frontmatter or --skill-version.'));
    process.exitCode = 1;
    return;
  }

  const spinner = createSpinner(`Publishing ${chalk.cyan(`${name}@${version}`)} to ${chalk.dim(registry)}...`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skild-publish-'));
  const tarballPath = path.join(tempDir, 'skill.tgz');

  try {
    await tar.c(
      {
        gzip: true,
        file: tarballPath,
        cwd: dir,
        portable: true,
        filter: p => !p.startsWith('.skild') && !p.startsWith('.git')
      },
      ['.']
    );

    const buf = fs.readFileSync(tarballPath);
    const integrity = sha256Hex(buf);

    const form = new FormData();
    form.set('version', version);
    form.set('description', description);
    form.set('targets', JSON.stringify(targets));
    form.set('tag', tag);
    form.append('tarball', new Blob([buf], { type: 'application/gzip' }), 'skill.tgz');

    const { scope, name: skillName } = splitCanonicalName(name);
    const res = await fetch(`${registry}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skillName)}/publish`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form as any
    });

    const text = await res.text();
    if (!res.ok) {
      spinner.fail(`Publish failed (${res.status})`);
      console.error(chalk.red(text));
      process.exitCode = 1;
      return;
    }

    if (options.json) {
      console.log(text);
      return;
    }

    spinner.succeed(`Published ${chalk.green(`${name}@${version}`)} (sha256:${integrity.slice(0, 12)}…)`);
  } catch (error: unknown) {
    spinner.fail('Publish failed');
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
