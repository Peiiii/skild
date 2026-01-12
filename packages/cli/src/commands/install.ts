import chalk from 'chalk';
import { installRegistrySkill, installSkill, SkildError, type Platform } from '@skild/core';
import { createSpinner, logger } from '../utils/logger.js';

export interface InstallCommandOptions {
  target?: Platform | string;
  local?: boolean;
  force?: boolean;
  registry?: string;
  json?: boolean;
}

export async function install(source: string, options: InstallCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';

  const spinner = createSpinner(`Installing ${chalk.cyan(source)} to ${chalk.dim(platform)} (${scope})...`);
  try {
    const record =
      source.trim().startsWith('@') && source.includes('/')
        ? await installRegistrySkill(
            { spec: source, registryUrl: options.registry },
            { platform, scope, force: Boolean(options.force) }
          )
        : await installSkill({ source }, { platform, scope, force: Boolean(options.force) });

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
  } catch (error: unknown) {
    spinner.fail(`Failed to install ${chalk.red(source)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}
