import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { deriveChildSource, fetchWithTimeout, installRegistrySkill, installSkill, isValidAlias, loadRegistryAuth, materializeSourceToTemp, resolveRegistryAlias, resolveRegistryUrl, SkildError, type InstallRecord, type Platform, PLATFORMS } from '@skild/core';
import { createSpinner, logger } from '../utils/logger.js';
import { promptSkillsInteractive, promptPlatformsInteractive, type SkillChoice } from '../utils/interactive-select.js';
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

type TreeNode = {
  id: string;
  name: string;
  children: TreeNode[];
  leafIndices: number[];
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

function buildSkillTree(found: DiscoveredSkillInstall[]): TreeNode {
  const root: TreeNode = { id: '', name: '.', children: [], leafIndices: [] };
  const byId = new Map<string, TreeNode>([['', root]]);

  for (let i = 0; i < found.length; i += 1) {
    const relPath = found[i].relPath;
    const parts = relPath === '.' ? ['.'] : relPath.split('/').filter(Boolean);
    let currentId = '';
    let current = root;
    current.leafIndices.push(i);
    for (const part of parts) {
      const nextId = currentId ? `${currentId}/${part}` : part;
      let node = byId.get(nextId);
      if (!node) {
        node = { id: nextId, name: part, children: [], leafIndices: [] };
        byId.set(nextId, node);
        current.children.push(node);
      }
      node.leafIndices.push(i);
      current = node;
      currentId = nextId;
    }
  }

  return root;
}

function getNodeState(node: TreeNode, selected: Set<number>): 'all' | 'none' | 'partial' {
  const total = node.leafIndices.length;
  if (total === 0) return 'none';
  let selectedCount = 0;
  for (const idx of node.leafIndices) {
    if (selected.has(idx)) selectedCount += 1;
  }
  if (selectedCount === 0) return 'none';
  if (selectedCount === total) return 'all';
  return 'partial';
}

function renderSkillTree(root: TreeNode, selected: Set<number>): Array<{ node: TreeNode; depth: number }> {
  const items: Array<{ node: TreeNode; depth: number }> = [];
  const stack: Array<{ node: TreeNode; depth: number }> = [];
  for (let i = root.children.length - 1; i >= 0; i -= 1) {
    stack.push({ node: root.children[i]!, depth: 0 });
  }
  while (stack.length) {
    const current = stack.pop()!;
    items.push(current);
    const children = current.node.children;
    for (let i = children.length - 1; i >= 0; i -= 1) {
      stack.push({ node: children[i]!, depth: current.depth + 1 });
    }
  }
  return items;
}

// Old parseSelectionInput, promptSkillSelection, promptPlatformSelection removed.
// Now using modern interactive-select.ts with @inquirer/prompts.

function printSelectedSkills(found: DiscoveredSkillInstall[]): void {
  const names = found.map(skill => skill.relPath);
  if (names.length === 0) return;
  const preview = names.slice(0, 20).map(name => `  - ${name}`).join('\n');
  console.log(chalk.dim(`\nSelected skills (${names.length}):`));
  console.log(preview);
  if (names.length > 20) {
    console.log(chalk.dim(`  ... and ${names.length - 20} more`));
  }
}

export async function install(source: string, options: InstallCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';
  const auth = loadRegistryAuth();
  const registryUrlForDeps = options.registry || auth?.registryUrl;
  const jsonOnly = Boolean(options.json);
  const recursive = Boolean(options.recursive);
  const yes = Boolean(options.yes);
  const maxDepth = parsePositiveInt(options.depth, 6);
  const maxSkills = parsePositiveInt(options.maxSkills, 200);
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !jsonOnly;
  const requestedAll = Boolean(options.all);
  const requestedTarget = options.target as Platform | undefined;

  if (requestedAll && options.target) {
    const message = 'Invalid options: use either --all or --target, not both.';
    if (jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return;
  }

  // Platform selection is now deferred until after skill selection for better UX.
  // Determine initial targets from CLI flags only; interactive selection happens later.
  let targets: Platform[] = [];
  let deferPlatformSelection = false;

  if (requestedAll) {
    targets = [...PLATFORMS];
  } else if (requestedTarget) {
    targets = [requestedTarget];
  } else if (yes) {
    targets = [...PLATFORMS];
  } else if (interactive) {
    // Will prompt for platforms after skill selection
    deferPlatformSelection = true;
    targets = [...PLATFORMS]; // Temporary default, will be replaced after prompt
  } else {
    targets = ['claude'];
  }

  const allPlatformsSelected = targets.length === PLATFORMS.length;

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

  const results: InstallRecord[] = [];
  const errors: Array<{ platform: Platform; error: string; inputSource?: string }> = [];

  let effectiveRecursive = recursive;
  let recursiveSkillCount: number | null = null;

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

  async function resolveDiscoveredSelection(
    found: DiscoveredSkillInstall[],
    spinner: { stop: () => void; start: () => void } | null
  ): Promise<DiscoveredSkillInstall[] | null> {
    if (found.length === 0) return null;

    if (found.length > maxSkills) {
      const message = `Found more than ${maxSkills} skills. Increase --max-skills to proceed.`;
      if (jsonOnly) printJson({ ok: false, error: 'TOO_MANY_SKILLS', message, source, resolvedSource, maxSkills });
      else console.error(chalk.red(message));
      process.exitCode = 1;
      return null;
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
        return null;
      }

      // Ora renders on a single line; pause it before printing lists/prompts.
      if (spinner) spinner.stop();

      const headline =
        found.length === 1
          ? `No SKILL.md found at root. Found 1 skill.\n`
          : `No SKILL.md found at root. Found ${found.length} skills.\n`;
      console.log(chalk.yellow(headline));

      if (!interactive && !yes) {
        console.log(chalk.dim(`Tip: rerun with ${chalk.cyan('skild install <source> --recursive')} to install all.`));
        process.exitCode = 1;
        return null;
      }

      if (!yes) {
        // Step 1: Select skills (using new modern UI)
        const selected = await promptSkillsInteractive(found, { defaultAll: true });
        if (!selected) {
          console.log(chalk.red('No skills selected.'));
          process.exitCode = 1;
          return null;
        }

        // Step 2: Select platforms (after skills, for better UX)
        if (deferPlatformSelection) {
          const selectedPlatforms = await promptPlatformsInteractive({ defaultAll: true });
          if (!selectedPlatforms) {
            console.log(chalk.red('No platforms selected.'));
            process.exitCode = 1;
            return null;
          }
          targets = selectedPlatforms;
          deferPlatformSelection = false;
        }

        effectiveRecursive = true;
        if (spinner) spinner.start();
        recursiveSkillCount = selected.length;
        return selected;
      }
      effectiveRecursive = true;
    }

    recursiveSkillCount = found.length;
    return found;
  }

  try {
    const spinner = jsonOnly
      ? null
      : createSpinner(
        allPlatformsSelected
          ? `Installing ${chalk.cyan(source)} to ${chalk.dim('all platforms')} (${scope})...`
          : targets.length > 1
            ? `Installing ${chalk.cyan(source)} to ${chalk.dim(`${targets.length} platforms`)} (${scope})...`
            : `Installing ${chalk.cyan(source)} to ${chalk.dim(targets[0])} (${scope})...`
      );

    let cleanupMaterialized: null | (() => void) = null;
    let materializedRoot: string | null = null;

    try {
      // Helper to prompt for platforms if deferred
      async function ensurePlatformSelection(): Promise<boolean> {
        if (!deferPlatformSelection) return true;

        const selectedPlatforms = await promptPlatformsInteractive({ defaultAll: true });
        if (!selectedPlatforms) {
          console.log(chalk.red('No platforms selected.'));
          process.exitCode = 1;
          return false;
        }
        targets = selectedPlatforms;
        deferPlatformSelection = false;
        return true;
      }

      if (resolvedSource.startsWith('@') && resolvedSource.includes('/')) {
        // Single registry skill: prompt for platforms first
        if (!(await ensurePlatformSelection())) return;
        await installOne(resolvedSource);
      } else {
        const maybeLocalRoot = path.resolve(resolvedSource);
        const isLocal = fs.existsSync(maybeLocalRoot);

        if (isLocal) {
          const hasSkillMd = fs.existsSync(path.join(maybeLocalRoot, 'SKILL.md'));
          if (hasSkillMd) {
            // Single local skill: prompt for platforms first
            if (!(await ensurePlatformSelection())) return;
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
            const selected = await resolveDiscoveredSelection(found, spinner);
            if (!selected) return;

            if (spinner) spinner.text = `Installing ${chalk.cyan(source)} — discovered ${selected.length} skills...`;
            for (const skill of selected) {
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
            const selected = await resolveDiscoveredSelection(found, spinner);
            if (!selected) return;

            if (spinner) spinner.text = `Installing ${chalk.cyan(source)} — discovered ${selected.length} skills...`;
            for (const skill of selected) {
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
      if (!effectiveRecursive && targets.length === 1) {
        if (errors.length) printJson({ ok: false, error: errors[0]?.error || 'Install failed.' });
        else printJson(results[0] ?? null);
      } else {
        printJson({
          ok: errors.length === 0,
          source,
          resolvedSource,
          scope,
          recursive: effectiveRecursive,
          all: allPlatformsSelected,
          recursiveSkillCount,
          results,
          errors
        });
      }
      process.exitCode = errors.length ? 1 : 0;
      return;
    }

    if (errors.length === 0) {
      const displayName = results[0]?.canonicalName || results[0]?.name || source;
      spinner!.succeed(
        effectiveRecursive
          ? `Installed ${chalk.green(String(recursiveSkillCount ?? results.length))}${chalk.dim(' skills')} to ${chalk.dim(`${targets.length} platforms`)}`
          : targets.length > 1
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
      if (!effectiveRecursive && targets.length === 1 && errors[0]) console.error(chalk.red(errors[0].error));
    }

    if (!effectiveRecursive && targets.length === 1 && results[0]) {
      const record = results[0];
      if (record.hasSkillMd) logger.installDetail('SKILL.md found ✓');
      else logger.installDetail('Warning: No SKILL.md found', true);

      if (record.skill?.validation && !record.skill.validation.ok) {
        logger.installDetail(`Validation: ${chalk.yellow('failed')} (${record.skill.validation.issues.length} issues)`, true);
      } else if (record.skill?.validation?.ok) {
        logger.installDetail(`Validation: ${chalk.green('ok')}`);
      }
    } else if (effectiveRecursive || targets.length > 1) {
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
