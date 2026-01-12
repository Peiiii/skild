import chalk from 'chalk';
import { canonicalNameToInstallDirName, updateSkill, SkildError, type Platform } from '@skild/core';
import { createSpinner } from '../utils/logger.js';

export interface UpdateCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function update(skill: string | undefined, options: UpdateCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';

  const label = skill ? skill : 'all skills';
  const resolvedName = skill && skill.trim().startsWith('@') && skill.includes('/') ? canonicalNameToInstallDirName(skill.trim()) : skill;
  const spinner = createSpinner(`Updating ${chalk.cyan(label)} on ${chalk.dim(platform)} (${scope})...`);

  try {
    const results = await updateSkill(resolvedName, { platform, scope });
    spinner.succeed(`Updated ${chalk.green(results.length.toString())} skill(s).`);
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error: unknown) {
    spinner.fail(`Failed to update ${chalk.red(label)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}
