import chalk from 'chalk';
import {
  PLATFORMS,
  getSkillInfo,
  getSkillInstallDir,
  installRegistrySkill,
  installSkill,
  listSkills,
  loadOrCreateGlobalConfig,
  type InstallRecord,
  type Platform
} from '@skild/core';
import { promptPlatformsInteractive, promptSyncTargetsInteractive, type SyncTargetChoice } from '../utils/interactive-select.js';
import { createSpinner, logger } from '../utils/logger.js';

export interface SyncCommandOptions {
  to?: string;
  all?: boolean;
  local?: boolean;
  json?: boolean;
  yes?: boolean;
  force?: boolean;
}

type SyncStatus = 'synced' | 'skipped' | 'failed';

interface SyncResult {
  skill: string;
  targetPlatform: Platform;
  sourcePlatform: Platform;
  sourceType: string;
  scope: 'global' | 'project';
  status: SyncStatus;
  reason?: string;
  installDir?: string;
}

function parsePlatformList(value: string | undefined): Platform[] {
  if (!value) return [];
  const parts = value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const valid = new Set<Platform>();
  for (const p of parts) {
    if ((PLATFORMS as readonly string[]).includes(p)) valid.add(p as Platform);
  }
  return Array.from(valid);
}

function platformDisplay(platform: Platform): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function buildRegistrySpec(record: InstallRecord): string {
  const canonical = record.canonicalName || record.source;
  const version = record.resolvedVersion || record.skill?.frontmatter?.version;
  if (version) return `${canonical}@${version}`;
  return canonical;
}

function pickSourceRecord(records: InstallRecord[], preferred?: Platform): InstallRecord | null {
  if (records.length === 0) return null;
  if (preferred) {
    const found = records.find(r => r.platform === preferred);
    if (found) return found;
  }
  const registry = records.find(r => r.sourceType === 'registry');
  if (registry) return registry;
  return records.slice().sort((a, b) => a.platform.localeCompare(b.platform))[0]!;
}

function getDisplayName(record: InstallRecord): string {
  return record.canonicalName || record.skill?.frontmatter?.name || record.name;
}

function collectInstalled(scope: 'global' | 'project'): Map<Platform, Map<string, InstallRecord>> {
  const map = new Map<Platform, Map<string, InstallRecord>>();
  for (const platform of PLATFORMS) {
    const skills = listSkills({ platform, scope });
    const inner = new Map<string, InstallRecord>();
    for (const s of skills) {
      if (!s.record) continue;
      inner.set(s.name, s.record);
    }
    map.set(platform, inner);
  }
  return map;
}

function deriveMissingTargets(
  scope: 'global' | 'project',
  preferredSource?: Platform,
  filterSkills?: string[],
  targetFilter?: Platform[]
): {
  choices: SyncTargetChoice[];
  plans: Array<{
    skill: string;
    displayName: string;
    targetPlatform: Platform;
    source: InstallRecord;
    sourcePlatforms: Platform[];
  }>;
  warnings: string[];
} {
  const installed = collectInstalled(scope);
  const skillNames = new Set<string>();
  const warnings: string[] = [];

  for (const records of installed.values()) {
    for (const name of records.keys()) skillNames.add(name);
  }

  const filteredSkillNames = filterSkills && filterSkills.length > 0
    ? Array.from(skillNames).filter(s => filterSkills.includes(s))
    : Array.from(skillNames);

  const targetSet = targetFilter && targetFilter.length > 0 ? new Set(targetFilter) : new Set(PLATFORMS);

  const plans: Array<{
    skill: string;
    displayName: string;
    targetPlatform: Platform;
    source: InstallRecord;
    sourcePlatforms: Platform[];
  }> = [];

  for (const skill of filteredSkillNames) {
    const sources = PLATFORMS.map(p => installed.get(p)?.get(skill)).filter(Boolean) as InstallRecord[];
    if (sources.length === 0) continue;

    const sourcePlatforms = sources.map(r => r.platform);
    const displayName = getDisplayName(sources[0]!);
    const sourceRecord = pickSourceRecord(sources, preferredSource);
    if (!sourceRecord) {
      warnings.push(`跳过 ${skill}：缺少可用的源记录`);
      continue;
    }

    for (const platform of PLATFORMS) {
      if (!targetSet.has(platform)) continue;
      if (installed.get(platform)?.has(skill)) continue;
      plans.push({
        skill,
        displayName,
        targetPlatform: platform,
        source: sourceRecord,
        sourcePlatforms
      });
    }
  }

  // Deduplicate choices for prompt
  const choices: SyncTargetChoice[] = plans.map(p => ({
    skill: p.skill,
    displayName: p.displayName,
    targetPlatform: p.targetPlatform,
    sourcePlatform: p.source.platform,
    sourceTypeLabel: p.source.sourceType === 'registry' ? 'registry' : 'local copy'
  }));

  return { choices, plans, warnings };
}

export async function sync(skills: string[] = [], options: SyncCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';
  const config = loadOrCreateGlobalConfig();
  const targetFilter = parsePlatformList(options.to);
  const preferredSourcePlatform = targetFilter.length === 0 ? config.defaultPlatform : undefined;
  const filterSkills = skills.map(s => s.trim()).filter(Boolean);

  const { choices, plans, warnings } = deriveMissingTargets(scope, preferredSourcePlatform, filterSkills, targetFilter);

  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  if (!options.json) {
    logger.header(`\n跨平台同步（scope: ${scope}）`);
    if (warnings.length) warnings.forEach(w => logger.warn(w));
  }

  if (plans.length === 0) {
    const message = filterSkills.length
      ? '没有可同步的目标（技能已在所有平台安装，或未找到源记录）。'
      : '所有平台已包含现有技能，无需同步。';
    if (options.json) {
      process.stdout.write(JSON.stringify({ ok: true, message, results: [] }) + '\n');
    } else {
      logger.warn(message);
    }
    return;
  }

  let selectedPlans = plans;
  if (interactive && !options.json && !options.yes) {
    const selectedChoices = await promptSyncTargetsInteractive(choices);
    if (!selectedChoices) {
      logger.warn('同步已取消。');
      return;
    }
    const selectedKey = new Set(selectedChoices.map(c => `${c.skill}::${c.targetPlatform}`));
    selectedPlans = plans.filter(p => selectedKey.has(`${p.skill}::${p.targetPlatform}`));
  }

  // Non-interactive defaults: select all
  const results: SyncResult[] = [];

  for (const plan of selectedPlans) {
    const { skill, displayName, targetPlatform, source, sourcePlatforms } = plan;
    const label = `${displayName} → ${platformDisplay(targetPlatform)}`;
    const installDir = getSkillInstallDir(targetPlatform, scope, source.name);

    let spinner: ReturnType<typeof createSpinner> | null = null;
    try {
      let targetRecord: InstallRecord | null = null;
      try {
        targetRecord = getSkillInfo(source.name, { platform: targetPlatform, scope });
      } catch {
        targetRecord = null;
      }

      if (targetRecord && !options.force) {
        results.push({
          skill,
          targetPlatform,
          sourcePlatform: source.platform,
          sourceType: source.sourceType,
          scope,
          status: 'skipped',
          reason: '目标已安装，使用 --force 可覆盖'
        });
        if (!options.json) logger.warn(`- ${label}: 目标已安装，使用 --force 可覆盖`);
        continue;
      }

      if (!options.json) {
        logger.dim(`- ${label}: 同步中...（源：${platformDisplay(source.platform)}${source.sourceType === 'registry' ? ', registry' : ', local copy'}）`);
      }
      spinner = options.json ? null : createSpinner(`同步 ${displayName} 到 ${platformDisplay(targetPlatform)}`);

      if (source.sourceType === 'registry') {
        await installRegistrySkill(
          { spec: buildRegistrySpec(source), registryUrl: source.registryUrl, nameOverride: source.name },
          { platform: targetPlatform, scope, force: true }
        );
      } else {
        await installSkill(
          { source: source.source, nameOverride: source.name, materializedDir: source.installDir },
          { platform: targetPlatform, scope, force: true, registryUrl: source.registryUrl }
        );
      }

      if (spinner) spinner.succeed(`同步完成 ${displayName} → ${platformDisplay(targetPlatform)}`);

      results.push({
        skill,
        targetPlatform,
        sourcePlatform: source.platform,
        sourceType: source.sourceType,
        scope,
        status: 'synced',
        installDir
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (spinner) spinner.fail(`同步失败 ${displayName} → ${platformDisplay(targetPlatform)}`);
      results.push({
        skill,
        targetPlatform,
        sourcePlatform: source.platform,
        sourceType: source.sourceType,
        scope,
        status: 'failed',
        reason: message
      });
      if (!options.json) {
        logger.error(`- ${label}: ${message}`);
      }
    }
  }

  if (options.json) {
    process.stdout.write(JSON.stringify({
      ok: results.every(r => r.status === 'synced'),
      scope,
      selected: selectedPlans.length,
      results
    }, null, 2) + '\n');
    return;
  }

  const synced = results.filter(r => r.status === 'synced').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  logger.header(`\n完成：${chalk.green(`${synced} 成功`)} / ${chalk.yellow(`${skipped} 跳过`)} / ${chalk.red(`${failed} 失败`)}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}
