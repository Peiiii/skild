import chalk from 'chalk';
import {
  canonicalNameToInstallDirName,
  uninstallSkill,
  SkildError,
  type InstallScope,
  type Platform,
} from '@skild/core';
import { createSpinner } from '../utils/logger.js';
import { formatTargetLabel, formatTargetSummary, resolveTargetSelection } from '../utils/target-selection.js';

export interface UninstallCommandOptions {
  target?: Platform | string;
  local?: boolean;
  global?: boolean;
  force?: boolean;
  withDeps?: boolean;
}

export async function uninstall(skill: string, options: UninstallCommandOptions = {}): Promise<void> {
  const canonical = skill.trim();
  const resolvedName = canonical.startsWith('@') && canonical.includes('/') ? canonicalNameToInstallDirName(canonical) : canonical;
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const selection = await resolveTargetSelection(options, interactive);
  if (!selection) return;

  const { platforms, scopes } = selection;
  const spinner = createSpinner(`Uninstalling ${chalk.cyan(canonical)}...`);
  const errors: Array<{ platform: Platform; scope: InstallScope; error: string }> = [];

  try {
    for (const scope of scopes) {
      for (const platform of platforms) {
        spinner.text = `Uninstalling ${chalk.cyan(canonical)} from ${chalk.dim(platform)} (${scope})...`;
        try {
          uninstallSkill(resolvedName, {
            platform,
            scope,
            allowMissingMetadata: Boolean(options.force),
            withDeps: Boolean(options.withDeps)
          } as any);
        } catch (error: unknown) {
          const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
          errors.push({ platform, scope, error: message });
        }
      }
    }

    const targetSummary = formatTargetSummary(platforms, scopes);
    if (errors.length === 0) {
      spinner.succeed(`Uninstalled ${chalk.green(canonical)} → ${chalk.dim(targetSummary)}.`);
      return;
    }

    spinner.fail(`Uninstalled ${chalk.green(canonical)} with ${chalk.red(errors.length.toString())} error(s) → ${chalk.dim(targetSummary)}.`);
    console.log(chalk.red('\n  Errors:'));
    for (const entry of errors.slice(0, 10)) {
      console.log(chalk.red(`    ✗ ${formatTargetLabel(entry.platform, entry.scope)}: ${entry.error}`));
    }
    if (errors.length > 10) {
      console.log(chalk.dim(`    ... and ${errors.length - 10} more errors`));
    }
    process.exitCode = 1;
  } catch (error: unknown) {
    spinner.fail(`Failed to uninstall ${chalk.red(canonical)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}
