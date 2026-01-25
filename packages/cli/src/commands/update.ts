import chalk from 'chalk';
import {
  canonicalNameToInstallDirName,
  updateSkill,
  SkildError,
  type InstallRecord,
  type InstallScope,
  type Platform,
} from '@skild/core';
import { createSpinner } from '../utils/logger.js';
import { formatTargetLabel, formatTargetSummary, hasInstalledSkill, resolveTargetSelection } from '../utils/target-selection.js';

export interface UpdateCommandOptions {
  target?: Platform | string;
  local?: boolean;
  global?: boolean;
  json?: boolean;
}

export async function update(skill: string | undefined, options: UpdateCommandOptions = {}): Promise<void> {
  const label = skill ? skill : 'all skills';
  const resolvedName = skill && skill.trim().startsWith('@') && skill.includes('/') ? canonicalNameToInstallDirName(skill.trim()) : skill;
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !options.json;
  const selection = await resolveTargetSelection(options, interactive, resolvedName || undefined);
  if (!selection) return;

  const { platforms, scopes } = selection;
  const spinner = createSpinner(`Updating ${chalk.cyan(label)}...`);
  const results: InstallRecord[] = [];
  const errors: Array<{ platform: Platform; scope: InstallScope; error: string }> = [];
  const skipped: Array<{ platform: Platform; scope: InstallScope }> = [];

  try {
    for (const scope of scopes) {
      for (const platform of platforms) {
        if (resolvedName && !hasInstalledSkill(platform, scope, resolvedName)) {
          skipped.push({ platform, scope });
          continue;
        }
        spinner.text = `Updating ${chalk.cyan(label)} on ${chalk.dim(platform)} (${scope})...`;
        try {
          const updated = await updateSkill(resolvedName, { platform, scope });
          results.push(...updated);
        } catch (error: unknown) {
          const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
          errors.push({ platform, scope, error: message });
        }
      }
    }

    if (options.json) {
      if (errors.length === 0 && platforms.length === 1 && scopes.length === 1) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(JSON.stringify({ ok: errors.length === 0, platforms, scopes, results, errors, skipped }, null, 2));
      }
      process.exitCode = errors.length ? 1 : 0;
      return;
    }

    const targetSummary = formatTargetSummary(platforms, scopes);
    if (errors.length === 0) {
      spinner.succeed(`Updated ${chalk.green(results.length.toString())} skill(s) → ${chalk.dim(targetSummary)}.`);
      if (skipped.length > 0) {
        console.log(chalk.dim(`\n  Skipped ${skipped.length} target(s) with no installed skill.`));
      }
      return;
    }

    spinner.fail(`Updated ${chalk.green(results.length.toString())} skill(s) with ${chalk.red(errors.length.toString())} error(s) → ${chalk.dim(targetSummary)}.`);
    console.log(chalk.red('\n  Errors:'));
    for (const entry of errors.slice(0, 10)) {
      console.log(chalk.red(`    ✗ ${formatTargetLabel(entry.platform, entry.scope)}: ${entry.error}`));
    }
    if (errors.length > 10) {
      console.log(chalk.dim(`    ... and ${errors.length - 10} more errors`));
    }
    process.exitCode = 1;
  } catch (error: unknown) {
    spinner.fail(`Failed to update ${chalk.red(label)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}
