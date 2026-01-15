import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { deriveChildSource, fetchWithTimeout, installRegistrySkill, installSkill, isValidAlias, loadRegistryAuth, materializeSourceToTemp, resolveRegistryAlias, resolveRegistryUrl, SkildError, type InstallRecord, type Platform, PLATFORMS } from '@skild/core';
import { createSpinner, logger } from '../utils/logger.js';
import { promptConfirm } from '../utils/prompt.js';
import { discoverSkillDirsWithHeuristics, parsePositiveInt, type DiscoveredSkillDir } from './install-discovery.js';

export interface InstallCommandOptions {
  target?: Platform | string;
  all?: boolean;
  recursive?: boolean;
  yes?: boolean;
  depth?: number | string;
  maxSkills?: number | string;
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

type DiscoveredSkillInstall = {
  relPath: string;
  suggestedSource: string;
  materializedDir?: string;
};

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function previewDiscovered(found: Array<Pick<DiscoveredSkillInstall, 'relPath'>>, limit = 12): string {
  const preview = found.slice(0, limit).map(s => `  - ${s.relPath}`).join('\n');
  return `${preview}${found.length > limit ? '\n  ...' : ''}`;
}

function asDiscoveredSkills(
  discovered: DiscoveredSkillDir[],
  toSuggestedSource: (dir: DiscoveredSkillDir) => string,
  toMaterializedDir?: (dir: DiscoveredSkillDir) => string | undefined
): DiscoveredSkillInstall[] {
  return discovered.map(d => ({
    relPath: d.relPath,
    suggestedSource: toSuggestedSource(d),
    materializedDir: toMaterializedDir ? toMaterializedDir(d) : undefined,
  }));
}

export async function install(source: string, options: InstallCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';
  const auth = loadRegistryAuth();
  const registryUrlForDeps = options.registry || auth?.registryUrl;
  const all = Boolean(options.all);
  const jsonOnly = Boolean(options.json);
  const recursive = Boolean(options.recursive);
  const yes = Boolean(options.yes);
  const maxDepth = parsePositiveInt(options.depth, 6);
  const maxSkills = parsePositiveInt(options.maxSkills, 200);
  const platform = (options.target as Platform) || 'claude';

  if (all && options.target) {
    const message = 'Invalid options: use either --all or --target, not both.';
    if (jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return;
  }

  let resolvedSource = source.trim();
  try {
    if (looksLikeAlias(resolvedSource)) {
      const registryUrl = resolveRegistryUrl(registryUrlForDeps);
      const resolved = await resolveRegistryAlias(registryUrl, resolvedSource);
      if (!jsonOnly) logger.info(`Resolved ${chalk.cyan(resolvedSource)} → ${chalk.cyan(resolved.spec)} (${resolved.type})`);
      resolvedSource = resolved.spec;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return;
  }

  const targets: Platform[] = all ? [...PLATFORMS] : [platform];

  const results: InstallRecord[] = [];
  const errors: Array<{ platform: Platform; error: string; inputSource?: string }> = [];

  let effectiveRecursive = recursive;
  let recursiveSkillCount: number | null = null;
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !jsonOnly;

  async function installOne(inputSource: string, materializedDir?: string): Promise<void> {
    for (const targetPlatform of targets) {
      try {
        const record =
          inputSource.startsWith('@') && inputSource.includes('/')
            ? await installRegistrySkill(
                { spec: inputSource, registryUrl: registryUrlForDeps },
                { platform: targetPlatform, scope, force: Boolean(options.force) }
              )
            : await installSkill(
                { source: inputSource, materializedDir },
                { platform: targetPlatform, scope, force: Boolean(options.force), registryUrl: registryUrlForDeps }
              );

        results.push(record);
        void reportDownload(record, registryUrlForDeps);
      } catch (error: unknown) {
        const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
        errors.push({ platform: targetPlatform, error: message, inputSource });
      }
    }
  }

  async function maybeEnableRecursiveAndInstall(
    found: DiscoveredSkillInstall[],
    spinner: { stop: () => void; start: () => void } | null
  ): Promise<boolean> {
    if (found.length === 0) return false;

    if (found.length > maxSkills) {
      const message = `Found more than ${maxSkills} skills. Increase --max-skills to proceed.`;
      if (jsonOnly) printJson({ ok: false, error: 'TOO_MANY_SKILLS', message, source, resolvedSource, maxSkills });
      else console.error(chalk.red(message));
      process.exitCode = 1;
      return true;
    }

    if (!effectiveRecursive) {
      if (jsonOnly) {
        const foundOutput = found.map(({ relPath, suggestedSource }) => ({ relPath, suggestedSource }));
        printJson({
          ok: false,
          error: 'MULTI_SKILL_SOURCE',
          message: 'Source is not a skill root (missing SKILL.md). Multiple skills were found.',
          source,
          resolvedSource,
          found: foundOutput,
        });
        process.exitCode = 1;
        return true;
      }

      // Ora renders on a single line; pause it before printing lists/prompts.
      if (spinner) spinner.stop();

      const headline =
        found.length === 1
          ? `No SKILL.md found at root. Found 1 skill:\n${previewDiscovered(found)}\n`
          : `No SKILL.md found at root. Found ${found.length} skills:\n${previewDiscovered(found)}\n`;
      console.log(chalk.yellow(headline));

      const question = found.length === 1 ? 'Install the discovered skill?' : 'Install all discovered skills?';
      const confirm = yes || (interactive && await promptConfirm(question, { defaultValue: found.length === 1 }));
      if (!confirm) {
        console.log(chalk.dim(`Tip: rerun with ${chalk.cyan('skild install <source> --recursive')} to install all.`));
        process.exitCode = 1;
        return true;
      }

      effectiveRecursive = true;
      if (spinner) spinner.start();
    }

    recursiveSkillCount = found.length;
    return false;
  }

  try {
    const spinner = jsonOnly
      ? null
      : createSpinner(
          all
            ? `Installing ${chalk.cyan(source)} to ${chalk.dim('all platforms')} (${scope})...`
            : `Installing ${chalk.cyan(source)} to ${chalk.dim(platform)} (${scope})...`
        );

    let cleanupMaterialized: null | (() => void) = null;
    let materializedRoot: string | null = null;

    try {
      if (resolvedSource.startsWith('@') && resolvedSource.includes('/')) {
        await installOne(resolvedSource);
      } else {
        const maybeLocalRoot = path.resolve(resolvedSource);
        const isLocal = fs.existsSync(maybeLocalRoot);

        if (isLocal) {
          const hasSkillMd = fs.existsSync(path.join(maybeLocalRoot, 'SKILL.md'));
          if (hasSkillMd) {
            await installOne(resolvedSource);
          } else {
            const discovered = discoverSkillDirsWithHeuristics(maybeLocalRoot, { maxDepth, maxSkills });
            if (discovered.length === 0) {
              const message = `No SKILL.md found at ${maybeLocalRoot} (or within subdirectories).`;
              if (jsonOnly) {
                printJson({ ok: false, error: 'SKILL_MD_NOT_FOUND', message, source, resolvedSource });
              } else {
                if (spinner) spinner.stop();
                console.error(chalk.red(message));
              }
              process.exitCode = 1;
              return;
            }

            const found = asDiscoveredSkills(discovered, d => path.join(maybeLocalRoot, d.relPath));
            const didReturn = await maybeEnableRecursiveAndInstall(found, spinner);
            if (didReturn) return;

            if (spinner) spinner.text = `Installing ${chalk.cyan(source)} — discovered ${found.length} skills...`;
            for (const skill of found) {
              if (spinner) spinner.text = `Installing ${chalk.cyan(skill.relPath)} (${scope})...`;
              await installOne(skill.suggestedSource, skill.materializedDir);
            }
          }
        } else {
          const materialized = await materializeSourceToTemp(resolvedSource);
          cleanupMaterialized = materialized.cleanup;
          materializedRoot = materialized.dir;

          const hasSkillMd = fs.existsSync(path.join(materializedRoot, 'SKILL.md'));
          if (hasSkillMd) {
            await installOne(resolvedSource, materializedRoot);
          } else {
            const discovered = discoverSkillDirsWithHeuristics(materializedRoot, { maxDepth, maxSkills });
            if (discovered.length === 0) {
              const message = `No SKILL.md found in source "${resolvedSource}".`;
              if (jsonOnly) {
                printJson({ ok: false, error: 'SKILL_MD_NOT_FOUND', message, source, resolvedSource });
              } else {
                if (spinner) spinner.stop();
                console.error(chalk.red(message));
              }
              process.exitCode = 1;
              return;
            }

            const found = asDiscoveredSkills(
              discovered,
              d => deriveChildSource(resolvedSource, d.relPath),
              d => d.absDir
            );
            const didReturn = await maybeEnableRecursiveAndInstall(found, spinner);
            if (didReturn) return;

            if (spinner) spinner.text = `Installing ${chalk.cyan(source)} — discovered ${found.length} skills...`;
            for (const skill of found) {
              if (spinner) spinner.text = `Installing ${chalk.cyan(skill.relPath)} (${scope})...`;
              await installOne(skill.suggestedSource, skill.materializedDir);
            }
          }
        }
      }
    } finally {
      if (cleanupMaterialized) cleanupMaterialized();
    }

    if (jsonOnly) {
      if (!all && !effectiveRecursive) {
        if (errors.length) printJson({ ok: false, error: errors[0]?.error || 'Install failed.' });
        else printJson(results[0] ?? null);
      } else {
        printJson({ ok: errors.length === 0, source, resolvedSource, scope, recursive: effectiveRecursive, all, recursiveSkillCount, results, errors });
      }
      process.exitCode = errors.length ? 1 : 0;
      return;
    }

    if (errors.length === 0) {
      const displayName = results[0]?.canonicalName || results[0]?.name || source;
      spinner!.succeed(
        effectiveRecursive
          ? `Installed ${chalk.green(String(recursiveSkillCount ?? results.length))}${chalk.dim(' skills')} to ${chalk.dim(`${targets.length} platforms`)}`
          : all
              ? `Installed ${chalk.green(displayName)} to ${chalk.dim(`${results.length} platforms`)}`
              : `Installed ${chalk.green(displayName)} to ${chalk.dim(results[0]?.installDir || '')}`
      );
    } else {
      const attempted = results.length + errors.length;
      spinner!.fail(
        effectiveRecursive
          ? `Install had failures (${errors.length}/${attempted} installs failed)`
          : `Failed to install ${chalk.red(source)} to ${errors.length}/${targets.length} platforms`
      );
      process.exitCode = 1;
      if (!all && errors[0]) console.error(chalk.red(errors[0].error));
    }

    if (!effectiveRecursive && !all && results[0]) {
      const record = results[0];
      if (record.hasSkillMd) logger.installDetail('SKILL.md found ✓');
      else logger.installDetail('Warning: No SKILL.md found', true);

      if (record.skill?.validation && !record.skill.validation.ok) {
        logger.installDetail(`Validation: ${chalk.yellow('failed')} (${record.skill.validation.issues.length} issues)`, true);
      } else if (record.skill?.validation?.ok) {
        logger.installDetail(`Validation: ${chalk.green('ok')}`);
      }
    } else if (effectiveRecursive || all) {
      for (const r of results.slice(0, 60)) {
        const displayName = r.canonicalName || r.name;
        const suffix = r.hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${suffix} ${chalk.cyan(displayName)} → ${chalk.dim(r.platform)}`);
      }
      if (results.length > 60) console.log(chalk.dim(`  ... and ${results.length - 60} more`));
      if (errors.length) {
        console.log(chalk.yellow('\nFailures:'));
        for (const e of errors) console.log(chalk.yellow(`  - ${e.platform}: ${e.error}`));
      }
      process.exitCode = errors.length ? 1 : 0;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
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
