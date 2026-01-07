import chalk from 'chalk';
import { uninstallSkill, SkildError, type Platform } from '@skild/core';
import { createSpinner } from '../utils/logger.js';

export interface UninstallCommandOptions {
  target?: Platform | string;
  local?: boolean;
  force?: boolean;
}

export async function uninstall(skill: string, options: UninstallCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';

  const spinner = createSpinner(`Uninstalling ${chalk.cyan(skill)} from ${chalk.dim(platform)} (${scope})...`);
  try {
    uninstallSkill(skill, { platform, scope, allowMissingMetadata: Boolean(options.force) } as any);
    spinner.succeed(`Uninstalled ${chalk.green(skill)}`);
  } catch (error: unknown) {
    spinner.fail(`Failed to uninstall ${chalk.red(skill)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

