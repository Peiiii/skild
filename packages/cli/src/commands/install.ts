import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { fetchWithTimeout, installRegistrySkill, installSkill, isValidAlias, loadRegistryAuth, resolveRegistryAlias, resolveRegistryUrl, SkildError, type Platform } from '@skild/core';
import { createSpinner, logger } from '../utils/logger.js';

export interface InstallCommandOptions {
  target?: Platform | string;
  local?: boolean;
  force?: boolean;
  registry?: string;
  json?: boolean;
}

function looksLikeAlias(input: string): boolean {
  const s = input.trim();
  if (!s) return false;
  if (s.startsWith('@')) return false;
  if (s.includes('/') || s.includes('\\')) return false;
  if (/^https?:\/\//i.test(s) || s.includes('github.com')) return false;
  if (fs.existsSync(path.resolve(s))) return false;
  if (!isValidAlias(s)) return false;
  return true;
}

export async function install(source: string, options: InstallCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';
  const auth = loadRegistryAuth();
  const registryUrlForDeps = options.registry || auth?.registryUrl;

  let resolvedSource = source.trim();
  try {
    if (looksLikeAlias(resolvedSource)) {
      const registryUrl = resolveRegistryUrl(registryUrlForDeps);
      const resolved = await resolveRegistryAlias(registryUrl, resolvedSource);
      if (!options.json) logger.info(`Resolved ${chalk.cyan(resolvedSource)} → ${chalk.cyan(resolved.spec)} (${resolved.type})`);
      resolvedSource = resolved.spec;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
    return;
  }

  const spinner = createSpinner(`Installing ${chalk.cyan(source)} to ${chalk.dim(platform)} (${scope})...`);
  try {
    const record =
      resolvedSource.startsWith('@') && resolvedSource.includes('/')
        ? await installRegistrySkill(
            { spec: resolvedSource, registryUrl: registryUrlForDeps },
            { platform, scope, force: Boolean(options.force) }
          )
        : await installSkill({ source: resolvedSource }, { platform, scope, force: Boolean(options.force), registryUrl: registryUrlForDeps });

    const displayName = record.canonicalName || record.name;
    spinner.succeed(`Installed ${chalk.green(displayName)} to ${chalk.dim(record.installDir)}`);

    if (options.json) {
      console.log(JSON.stringify(record, null, 2));
      return;
    }

    if (record.hasSkillMd) {
      logger.installDetail('SKILL.md found ✓');
    } else {
      logger.installDetail('Warning: No SKILL.md found', true);
    }

    if (record.skill?.validation && !record.skill.validation.ok) {
      logger.installDetail(`Validation: ${chalk.yellow('failed')} (${record.skill.validation.issues.length} issues)`, true);
    } else if (record.skill?.validation?.ok) {
      logger.installDetail(`Validation: ${chalk.green('ok')}`);
    }

    void reportDownload(record, registryUrlForDeps);
  } catch (error: unknown) {
    spinner.fail(`Failed to install ${chalk.red(source)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

async function reportDownload(
  record: { sourceType: string; canonicalName?: string; source: string; registryUrl?: string },
  registryOverride?: string
): Promise<void> {
  try {
    if (record.sourceType === 'local') return;
    const registryUrl = resolveRegistryUrl(record.registryUrl || registryOverride);
    const endpoint = `${registryUrl}/stats/downloads`;

    const payload: Record<string, unknown> = { source: 'cli' };
    if (record.sourceType === 'registry') {
      payload.entityType = 'registry';
      payload.entityId = record.canonicalName || record.source;
    } else if (record.sourceType === 'github-url') {
      payload.entityType = 'linked';
      payload.sourceInput = { provider: 'github', url: record.source };
    } else if (record.sourceType === 'degit-shorthand') {
      payload.entityType = 'linked';
      payload.sourceInput = { provider: 'github', spec: record.source };
    } else {
      return;
    }

    await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      },
      3000
    );
  } catch {
    // best-effort only
  }
}
