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
import { promptPlatformsInteractive } from '../utils/interactive-select.js';
import { createSpinner, logger } from '../utils/logger.js';

export interface SyncCommandOptions {
  from?: Platform | string;
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
  sourcePlatform: Platform;
  targetPlatform: Platform;
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

async function resolveTargets(from: Platform, options: SyncCommandOptions): Promise<Platform[]> {
  if (options.all) {
    return PLATFORMS.filter(p => p !== from);
  }

  const toList = parsePlatformList(options.to);
  if (toList.length > 0) {
    return toList.filter(p => p !== from);
  }

  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  if (interactive && !options.json && !options.yes) {
    const platforms = await promptPlatformsInteractive({ defaultAll: true, platforms: PLATFORMS.filter(p => p !== from) });
    if (!platforms || platforms.length === 0) {
      throw new Error('同步已取消：未选择目标平台。');
    }
    return platforms.filter(p => p !== from);
  }

  // Default: sync to all other platforms.
  return PLATFORMS.filter(p => p !== from);
}

function pickSkillNames(skillArgs: string[], installed: ReturnType<typeof listSkills>): string[] {
  const requested = skillArgs.map(s => s.trim()).filter(Boolean);
  if (requested.length === 0) {
    return installed.map(s => s.name);
  }

  const available = new Set(installed.map(s => s.name));
  const missing = requested.filter(name => !available.has(name));
  if (missing.length > 0) {
    throw new Error(`Source platform缺少指定的 skill：${missing.join(', ')}`);
  }
  return Array.from(new Set(requested));
}

function buildRegistrySpec(record: InstallRecord): string {
  const canonical = record.canonicalName || record.source;
  if (record.resolvedVersion) return `${canonical}@${record.resolvedVersion}`;
  return canonical;
}

function isAlreadyInSync(targetRecord: InstallRecord, sourceRecord: InstallRecord): boolean {
  if (targetRecord.contentHash && sourceRecord.contentHash && targetRecord.contentHash === sourceRecord.contentHash) {
    return true;
  }

  if (
    targetRecord.sourceType === 'registry' &&
    sourceRecord.sourceType === 'registry' &&
    targetRecord.canonicalName === (sourceRecord.canonicalName || sourceRecord.source)
  ) {
    const targetVersion = targetRecord.resolvedVersion || targetRecord.skill?.frontmatter?.version;
    const sourceVersion = sourceRecord.resolvedVersion || sourceRecord.skill?.frontmatter?.version;
    if (targetVersion && sourceVersion && targetVersion === sourceVersion) {
      return true;
    }
  }

  if (targetRecord.source === sourceRecord.source && targetRecord.sourceType === sourceRecord.sourceType) {
    return true;
  }

  return false;
}

export async function sync(skills: string[] = [], options: SyncCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';
  const config = loadOrCreateGlobalConfig();
  const sourcePlatform = (options.from as Platform) || config.defaultPlatform;

  const installed = listSkills({ platform: sourcePlatform, scope });
  if (installed.length === 0) {
    const message = `在 ${sourcePlatform} (${scope}) 上没有已安装的 skills，可先用 skild install 安装。`;
    if (options.json) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n');
    } else {
      logger.warn(message);
    }
    process.exitCode = 1;
    return;
  }

  let targetPlatforms: Platform[] = [];
  try {
    targetPlatforms = await resolveTargets(sourcePlatform, options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n');
    } else {
      logger.error(message);
    }
    process.exitCode = 1;
    return;
  }

  if (targetPlatforms.length === 0) {
    const message = '没有可同步的目标平台。';
    if (options.json) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n');
    } else {
      logger.warn(message);
    }
    return;
  }

  let skillNames: string[];
  try {
    skillNames = pickSkillNames(skills, installed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n');
    } else {
      logger.error(message);
    }
    process.exitCode = 1;
    return;
  }

  const results: SyncResult[] = [];
  if (!options.json) {
    logger.header(`\nSync skills from ${chalk.cyan(sourcePlatform)} (${scope}) → ${targetPlatforms.map(p => chalk.cyan(p)).join(', ')}`);
  }

  for (const skillName of skillNames) {
    let sourceRecord: InstallRecord;
    try {
      sourceRecord = getSkillInfo(skillName, { platform: sourcePlatform, scope });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      for (const target of targetPlatforms) {
        results.push({
          skill: skillName,
          sourcePlatform,
          targetPlatform: target,
          scope,
          status: 'failed',
          reason: message
        });
      }
      if (!options.json) {
        logger.error(`无法读取 ${skillName} 的安装记录：${message}`);
      }
      continue;
    }

    for (const targetPlatform of targetPlatforms) {
      const label = `${skillName} → ${targetPlatform}`;
      const installDir = getSkillInstallDir(targetPlatform, scope, sourceRecord.name);

      let spinner: ReturnType<typeof createSpinner> | null = null;
      try {
        let targetRecord: InstallRecord | null = null;
        try {
          targetRecord = getSkillInfo(sourceRecord.name, { platform: targetPlatform, scope });
        } catch {
          targetRecord = null;
        }

        if (targetRecord && !options.force) {
          if (isAlreadyInSync(targetRecord, sourceRecord)) {
            results.push({
              skill: skillName,
              sourcePlatform,
              targetPlatform,
              scope,
              status: 'skipped',
              reason: '已同步'
            });
            if (!options.json) logger.dim(`- ${label}: 已同步，跳过`);
            continue;
          }
          results.push({
            skill: skillName,
            sourcePlatform,
            targetPlatform,
            scope,
            status: 'skipped',
            reason: '目标已安装，使用 --force 可覆盖'
          });
          if (!options.json) logger.warn(`- ${label}: 目标已安装，使用 --force 可覆盖`);
          continue;
        }

        if (!options.json) {
          logger.dim(`- ${label}: 同步中...`);
        }
        spinner = options.json ? null : createSpinner(`同步 ${skillName} 到 ${targetPlatform}`);

        if (sourceRecord.sourceType === 'registry') {
          await installRegistrySkill(
            { spec: buildRegistrySpec(sourceRecord), registryUrl: sourceRecord.registryUrl, nameOverride: sourceRecord.name },
            { platform: targetPlatform, scope, force: true }
          );
        } else {
          await installSkill(
            { source: sourceRecord.source, nameOverride: sourceRecord.name, materializedDir: sourceRecord.installDir },
            { platform: targetPlatform, scope, force: true, registryUrl: sourceRecord.registryUrl }
          );
        }

        if (spinner) spinner.succeed(`同步完成 ${skillName} → ${targetPlatform}`);

        results.push({
          skill: skillName,
          sourcePlatform,
          targetPlatform,
          scope,
          status: 'synced',
          installDir
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (spinner) spinner.fail(`同步失败 ${skillName} → ${targetPlatform}`);
        results.push({
          skill: skillName,
          sourcePlatform,
          targetPlatform,
          scope,
          status: 'failed',
          reason: message
        });
        if (!options.json) {
          logger.error(`- ${label}: ${message}`);
        }
      }
    }
  }

  if (options.json) {
    process.stdout.write(JSON.stringify({ ok: true, sourcePlatform, targetPlatforms, scope, results }, null, 2) + '\n');
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
