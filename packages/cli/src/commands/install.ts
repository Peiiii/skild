import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import {
  deriveChildSource,
  fetchWithTimeout,
  installRegistrySkill,
  installSkill,
  isValidAlias,
  listSkills,
  loadRegistryAuth,
  materializeSourceToTemp,
  resolveRegistryAlias,
  resolveRegistryUrl,
  stripSourceRef,
  SkildError,
  type InstallRecord,
  type InstallScope,
  type Platform,
  PLATFORMS
} from '@skild/core';
import { createSpinner, logger } from '../utils/logger.js';
import { promptSkillsInteractive, promptPlatformsInteractive, type SkillChoice } from '../utils/interactive-select.js';
import { discoverSkillDirsWithHeuristics, parsePositiveInt, type DiscoveredSkillDir } from './install-discovery.js';

// ============================================================================
// Types
// ============================================================================

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

type DiscoveredSkillInstall = {
  relPath: string;
  suggestedSource: string;
  materializedDir?: string;
};

/** Unified context object for the install pipeline. */
interface InstallContext {
  // Input
  source: string;
  options: InstallCommandOptions;

  // Config (derived from options)
  scope: 'global' | 'project';
  registryUrl: string | undefined;
  jsonOnly: boolean;
  interactive: boolean;
  yes: boolean;
  maxDepth: number;
  maxSkills: number;

  // Mutable state
  resolvedSource: string;
  targets: Platform[];
  forceOverwrite: boolean;
  needsPlatformPrompt: boolean;

  // Discovery results
  discoveredSkills: DiscoveredSkillInstall[] | null;
  selectedSkills: DiscoveredSkillInstall[] | null;
  isSingleSkill: boolean;
  materializedDir: string | null;
  cleanupMaterialized: (() => void) | null;

  // Execution results
  results: InstallRecord[];
  errors: Array<{ platform: Platform; error: string; inputSource?: string }>;
  skipped: Array<{ skillName: string; platform: Platform; installDir: string }>;

  // UI
  spinner: ReturnType<typeof createSpinner> | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

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

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function getInstalledPlatforms(scope: InstallScope): Platform[] {
  return PLATFORMS.filter(platform => listSkills({ platform, scope }).length > 0);
}

function getPlatformPromptList(scope: InstallScope): Platform[] {
  const installed = getInstalledPlatforms(scope);
  return installed.length > 0 ? installed : [...PLATFORMS];
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

// ============================================================================
// Stage 1: Create Context
// ============================================================================

function createContext(source: string, options: InstallCommandOptions): InstallContext {
  const scope = options.local ? 'project' : 'global';
  const auth = loadRegistryAuth();
  const registryUrl = options.registry || auth?.registryUrl;
  const jsonOnly = Boolean(options.json);
  const yes = Boolean(options.yes);
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !jsonOnly;

  // Determine initial targets
  let targets: Platform[] = [];
  let needsPlatformPrompt = false;

  if (options.all) {
    targets = [...PLATFORMS];
  } else if (options.target) {
    targets = [options.target as Platform];
  } else if (yes) {
    targets = [...PLATFORMS];
  } else if (interactive) {
    needsPlatformPrompt = true;
    targets = [...PLATFORMS]; // Temporary, will be replaced after prompt
  } else {
    targets = ['claude'];
  }

  return {
    source,
    options,
    scope,
    registryUrl,
    jsonOnly,
    interactive,
    yes,
    maxDepth: parsePositiveInt(options.depth, 6),
    maxSkills: parsePositiveInt(options.maxSkills, 200),
    resolvedSource: source.trim(),
    targets,
    forceOverwrite: Boolean(options.force),
    needsPlatformPrompt,
    discoveredSkills: null,
    selectedSkills: null,
    isSingleSkill: false,
    materializedDir: null,
    cleanupMaterialized: null,
    results: [],
    errors: [],
    skipped: [],
    spinner: null,
  };
}

// ============================================================================
// Stage 2: Resolve Source
// ============================================================================

async function resolveSource(ctx: InstallContext): Promise<boolean> {
  // Validate conflicting options
  if (ctx.options.all && ctx.options.target) {
    const message = 'Invalid options: use either --all or --target, not both.';
    if (ctx.jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return false;
  }

  // Resolve alias if needed
  try {
    if (looksLikeAlias(ctx.resolvedSource)) {
      if (ctx.spinner) ctx.spinner.text = `Resolving ${chalk.cyan(ctx.resolvedSource)}...`;
      const registryUrl = resolveRegistryUrl(ctx.registryUrl);
      const resolved = await resolveRegistryAlias(registryUrl, ctx.resolvedSource);
      if (!ctx.jsonOnly) {
        const displaySpec = stripSourceRef(resolved.spec);
        logger.info(`Resolved ${chalk.cyan(ctx.resolvedSource)} → ${chalk.cyan(displaySpec)} (${resolved.type})`);
      }
      ctx.resolvedSource = resolved.spec;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (ctx.jsonOnly) printJson({ ok: false, error: message });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return false;
  }

  return true;
}

// ============================================================================
// Stage 3: Discover Skills
// ============================================================================

async function discoverSkills(ctx: InstallContext): Promise<boolean> {
  const { resolvedSource, maxDepth, maxSkills, jsonOnly } = ctx;

  // Update spinner text
  if (ctx.spinner) {
    ctx.spinner.text = `Discovery at ${chalk.cyan(ctx.source)}...`;
  }

  try {
    // Case 1: Registry skill (@scope/name)
    if (resolvedSource.startsWith('@') && resolvedSource.includes('/')) {
      ctx.isSingleSkill = true;
      ctx.selectedSkills = [{ relPath: resolvedSource, suggestedSource: resolvedSource }];
      return true;
    }

    // Case 2: Local path
    const maybeLocalRoot = path.resolve(resolvedSource);
    const isLocal = fs.existsSync(maybeLocalRoot);

    if (isLocal) {
      const hasSkillMd = fs.existsSync(path.join(maybeLocalRoot, 'SKILL.md'));
      if (hasSkillMd) {
        ctx.isSingleSkill = true;
        ctx.selectedSkills = [{ relPath: maybeLocalRoot, suggestedSource: resolvedSource }];
        return true;
      }

      // Discover skills in directory
      const discovered = discoverSkillDirsWithHeuristics(maybeLocalRoot, { maxDepth, maxSkills });
      if (discovered.length === 0) {
        const message = `No SKILL.md found at ${maybeLocalRoot} (or within subdirectories).`;
        if (jsonOnly) {
          printJson({ ok: false, error: 'SKILL_MD_NOT_FOUND', message, source: ctx.source, resolvedSource });
        } else {
          if (ctx.spinner) ctx.spinner.stop();
          console.error(chalk.red(message));
        }
        process.exitCode = 1;
        return false;
      }

      ctx.discoveredSkills = asDiscoveredSkills(discovered, d => path.join(maybeLocalRoot, d.relPath));
      return true;
    }

    // Case 3: Remote source - materialize first
    const materialized = await materializeSourceToTemp(resolvedSource);
    ctx.materializedDir = materialized.dir;
    ctx.cleanupMaterialized = materialized.cleanup;

    const hasSkillMd = fs.existsSync(path.join(ctx.materializedDir, 'SKILL.md'));
    if (hasSkillMd) {
      ctx.isSingleSkill = true;
      ctx.selectedSkills = [{ relPath: '.', suggestedSource: resolvedSource, materializedDir: ctx.materializedDir }];
      return true;
    }

    // Discover skills in materialized directory
    const discovered = discoverSkillDirsWithHeuristics(ctx.materializedDir, { maxDepth, maxSkills });
    if (discovered.length === 0) {
      const message = `No SKILL.md found in source "${resolvedSource}".`;
      if (jsonOnly) {
        printJson({ ok: false, error: 'SKILL_MD_NOT_FOUND', message, source: ctx.source, resolvedSource });
      } else {
        if (ctx.spinner) ctx.spinner.stop();
        console.error(chalk.red(message));
      }
      process.exitCode = 1;
      return false;
    }

    ctx.discoveredSkills = asDiscoveredSkills(
      discovered,
      d => deriveChildSource(resolvedSource, d.relPath),
      d => d.absDir
    );
    return true;

  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (jsonOnly) printJson({ ok: false, error: message });
    else {
      if (ctx.spinner) ctx.spinner.stop();
      console.error(chalk.red(message));
    }
    process.exitCode = 1;
    return false;
  }
}

// ============================================================================
// Stage 4: Prompt User Selections
// ============================================================================

async function promptSelections(ctx: InstallContext): Promise<boolean> {
  const { discoveredSkills, isSingleSkill, jsonOnly, interactive, yes, options } = ctx;

  // Single skill: just prompt for platforms if needed
  if (isSingleSkill) {
    if (ctx.needsPlatformPrompt) {
      if (ctx.spinner) ctx.spinner.stop();
      const selectedPlatforms = await promptPlatformsInteractive({
        defaultAll: true,
        platforms: getPlatformPromptList(ctx.scope),
      });
      if (!selectedPlatforms) {
        console.log(chalk.red('No platforms selected.'));
        process.exitCode = 1;
        return false;
      }
      ctx.targets = selectedPlatforms;
      ctx.needsPlatformPrompt = false;
    }
    return true;
  }

  // Multiple skills discovered
  if (!discoveredSkills || discoveredSkills.length === 0) {
    return false;
  }

  // Check max skills limit
  if (discoveredSkills.length > ctx.maxSkills) {
    const message = `Found more than ${ctx.maxSkills} skills. Increase --max-skills to proceed.`;
    if (jsonOnly) printJson({ ok: false, error: 'TOO_MANY_SKILLS', message, source: ctx.source, resolvedSource: ctx.resolvedSource, maxSkills: ctx.maxSkills });
    else console.error(chalk.red(message));
    process.exitCode = 1;
    return false;
  }

  // Non-interactive mode without --recursive
  if (!options.recursive && !yes) {
    if (jsonOnly) {
      const foundOutput = discoveredSkills.map(({ relPath, suggestedSource }) => ({ relPath, suggestedSource }));
      printJson({
        ok: false,
        error: 'MULTI_SKILL_SOURCE',
        message: 'Source is not a skill root (missing SKILL.md). Multiple skills were found.',
        source: ctx.source,
        resolvedSource: ctx.resolvedSource,
        found: foundOutput,
      });
      process.exitCode = 1;
      return false;
    }

    if (ctx.spinner) ctx.spinner.stop();

    const headline = discoveredSkills.length === 1
      ? `No SKILL.md found at root. Found 1 skill.\n`
      : `No SKILL.md found at root. Found ${discoveredSkills.length} skills.\n`;
    console.log(chalk.yellow(headline));

    if (!interactive) {
      console.log(chalk.dim(`Tip: rerun with ${chalk.cyan('skild install <source> --recursive')} to install all.`));
      process.exitCode = 1;
      return false;
    }
  }

  // Interactive selection
  if (!yes && interactive) {
    if (ctx.spinner) ctx.spinner.stop();

    // Don't show headline again if we just showed it above
    if (options.recursive) {
      const headline = discoveredSkills.length === 1
        ? `No SKILL.md found at root. Found 1 skill.\n`
        : `No SKILL.md found at root. Found ${discoveredSkills.length} skills.\n`;
      console.log(chalk.yellow(headline));
    }

    // Step 1: Select skills
    const selected = await promptSkillsInteractive(discoveredSkills, { defaultAll: true });
    if (!selected) {
      console.log(chalk.red('No skills selected.'));
      process.exitCode = 1;
      return false;
    }
    ctx.selectedSkills = selected;

    // Step 2: Select platforms
    if (ctx.needsPlatformPrompt) {
      const selectedPlatforms = await promptPlatformsInteractive({
        defaultAll: true,
        platforms: getPlatformPromptList(ctx.scope),
      });
      if (!selectedPlatforms) {
        console.log(chalk.red('No platforms selected.'));
        process.exitCode = 1;
        return false;
      }
      ctx.targets = selectedPlatforms;
      ctx.needsPlatformPrompt = false;
    }

    if (ctx.spinner) ctx.spinner.start();
  } else {
    // Auto-select all
    ctx.selectedSkills = discoveredSkills;
  }

  return true;
}

// ============================================================================
// Stage 5: Execute Installs
// ============================================================================

async function executeInstalls(ctx: InstallContext): Promise<void> {
  const { selectedSkills, targets, scope, forceOverwrite, registryUrl, spinner } = ctx;

  if (!selectedSkills || selectedSkills.length === 0) {
    return;
  }

  const totalSkills = selectedSkills.length;
  const isMulti = totalSkills > 1;
  let currentIdx = 0;

  for (const skill of selectedSkills) {
    currentIdx += 1;
    const skillName = skill.relPath === '.' ? ctx.source : skill.relPath;

    if (spinner) {
      spinner.text = isMulti
        ? `Installing ${chalk.cyan(skillName)} ${chalk.dim(`(${currentIdx}/${totalSkills})`)}...`
        : `Installing ${chalk.cyan(skillName)}...`;
    }

    for (const platform of targets) {
      try {
        const record = skill.suggestedSource.startsWith('@') && skill.suggestedSource.includes('/')
          ? await installRegistrySkill(
            { spec: skill.suggestedSource, registryUrl },
            { platform, scope, force: forceOverwrite }
          )
          : await installSkill(
            { source: skill.suggestedSource, materializedDir: skill.materializedDir },
            { platform, scope, force: forceOverwrite, registryUrl }
          );

        ctx.results.push(record);
        void reportDownload(record, registryUrl);
      } catch (error: unknown) {
        // Handle already-installed by skipping
        if (error instanceof SkildError && error.code === 'ALREADY_INSTALLED') {
          const details = error.details as { skillName?: string; installDir?: string } | undefined;
          ctx.skipped.push({
            skillName: details?.skillName || skill.suggestedSource,
            platform,
            installDir: details?.installDir || '',
          });
          continue;
        }
        const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
        ctx.errors.push({ platform, error: message, inputSource: skill.suggestedSource });
      }
    }
  }
}

// ============================================================================
// Stage 6: Report Results
// ============================================================================

function reportResults(ctx: InstallContext): void {
  const { results, errors, skipped, spinner, jsonOnly, selectedSkills, targets } = ctx;

  // Cleanup materialized directory
  if (ctx.cleanupMaterialized) {
    ctx.cleanupMaterialized();
  }

  const isMultiSkill = (selectedSkills?.length ?? 0) > 1;

  // JSON output mode
  if (jsonOnly) {
    if (!isMultiSkill && targets.length === 1) {
      if (errors.length) printJson({ ok: false, error: errors[0]?.error || 'Install failed.' });
      else printJson(results[0] ?? null);
    } else {
      printJson({
        ok: errors.length === 0,
        source: ctx.source,
        resolvedSource: ctx.resolvedSource,
        scope: ctx.scope,
        recursive: isMultiSkill,
        all: targets.length === PLATFORMS.length,
        skillCount: selectedSkills?.length ?? 0,
        results,
        errors,
        skipped,
      });
    }
    process.exitCode = errors.length ? 1 : 0;
    return;
  }

  const platformsLabel = targets.length === PLATFORMS.length
    ? 'all platforms'
    : targets.length === 1
      ? targets[0]
      : `${targets.length} platforms`;

  if (errors.length === 0 && (results.length > 0 || skipped.length > 0)) {
    const displayName = results[0]?.canonicalName || results[0]?.name || ctx.source;
    const skillCount = selectedSkills?.length ?? results.length;

    const uniqueSkippedSkills = [...new Set(skipped.map(s => s.skillName))];
    if (skipped.length > 0 && results.length > 0) {
      spinner?.succeed(
        `Installed ${chalk.green(results.length)} skill${results.length > 1 ? 's' : ''}, skipped ${chalk.dim(`${uniqueSkippedSkills.length} skill${uniqueSkippedSkills.length > 1 ? 's' : ''}`)} → ${chalk.dim(platformsLabel)}`
      );
    } else if (skipped.length > 0) {
      spinner?.succeed(
        `Skipped ${chalk.dim(`${uniqueSkippedSkills.length} skill${uniqueSkippedSkills.length > 1 ? 's' : ''}`)} (already installed) → ${chalk.dim(platformsLabel)}`
      );
    } else {
      spinner?.succeed(
        isMultiSkill
          ? `Installed ${chalk.green(skillCount)} skill${skillCount > 1 ? 's' : ''} → ${chalk.dim(platformsLabel)}`
          : `Installed ${chalk.green(displayName)} → ${chalk.dim(results[0]?.installDir || platformsLabel)}`
      );
    }
  } else if (errors.length > 0) {
    const attempted = results.length + errors.length;
    spinner?.fail(
      isMultiSkill
        ? `Install failed: ${chalk.red(errors.length)}/${attempted} errors`
        : `Failed to install ${chalk.red(ctx.source)}`
    );
    process.exitCode = 1;
  }

  if (isMultiSkill && results.length > 0) {
    const groupedByPlatform = new Map<Platform, typeof results>();
    for (const r of results) {
      const list = groupedByPlatform.get(r.platform) || [];
      list.push(r);
      groupedByPlatform.set(r.platform, list);
    }

    const uniqueSkillNames = [...new Set(results.map(r => r.canonicalName || r.name))];
    if (uniqueSkillNames.length <= 20) {
      console.log();
      for (const name of uniqueSkillNames.slice(0, 20)) {
        const record = results.find(r => (r.canonicalName || r.name) === name);
        const icon = record?.hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${icon} ${chalk.cyan(name)}`);
      }
    } else {
      console.log(chalk.dim(`\n  ${uniqueSkillNames.length} skills installed`));
      for (const name of uniqueSkillNames.slice(0, 8)) {
        console.log(chalk.dim(`    • ${name}`));
      }
      console.log(chalk.dim(`    ... and ${uniqueSkillNames.length - 8} more`));
    }
  } else if (!isMultiSkill && targets.length === 1 && results[0]) {
    const record = results[0];
    if (!record.hasSkillMd) {
      console.log(chalk.yellow(`  ⚠ No SKILL.md found`));
    }
    if (record.skill?.validation && !record.skill.validation.ok) {
      console.log(chalk.yellow(`  ⚠ Validation failed (${record.skill.validation.issues.length} issues)`));
    }
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n  Errors:`));
    for (const e of errors.slice(0, 10)) {
      const prefix = e.inputSource ? `${e.inputSource} → ${e.platform}` : e.platform;
      console.log(chalk.red(`    ✗ ${prefix}: ${e.error}`));
    }
    if (errors.length > 10) {
      console.log(chalk.dim(`    ... and ${errors.length - 10} more errors`));
    }
    process.exitCode = 1;
  }

  if (skipped.length > 0) {
    const uniqueSkills = [...new Set(skipped.map(s => s.skillName))];
    console.log(chalk.dim(`\n  ${uniqueSkills.length} skill${uniqueSkills.length > 1 ? 's' : ''} already installed (skipped):`));

    const bySkill = new Map<string, Platform[]>();
    for (const s of skipped) {
      const platforms = bySkill.get(s.skillName) || [];
      platforms.push(s.platform);
      bySkill.set(s.skillName, platforms);
    }

    for (const [skillName] of [...bySkill.entries()].slice(0, 5)) {
      console.log(chalk.dim(`    • ${skillName}`));
    }
    if (bySkill.size > 5) {
      console.log(chalk.dim(`    ... and ${bySkill.size - 5} more`));
    }
    console.log(chalk.dim(`\n  💡 Reinstall with: ${chalk.cyan(`skild install ${ctx.source} --force`)}`));
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function install(source: string, options: InstallCommandOptions = {}): Promise<void> {
  const ctx = createContext(source, options);

  // Immediate feedback
  if (!ctx.jsonOnly) {
    ctx.spinner = createSpinner(`Interpreting ${chalk.cyan(ctx.source)}...`);
  }

  try {
    if (!await resolveSource(ctx)) return;
    if (!await discoverSkills(ctx)) return;
    if (!await promptSelections(ctx)) return;
    await executeInstalls(ctx);
    reportResults(ctx);
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (ctx.jsonOnly) printJson({ ok: false, error: message });
    else {
      if (ctx.spinner) ctx.spinner.fail(chalk.red(message));
      else console.error(chalk.red(message));
    }
    process.exitCode = 1;

    // Cleanup on error
    if (ctx.cleanupMaterialized) ctx.cleanupMaterialized();
  }
}

// ============================================================================
// Analytics Helper
// ============================================================================

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
