import chalk from 'chalk';
import { initSkill, SkildError } from '@skild/core';
import { createSpinner } from '../utils/logger.js';

export interface InitCommandOptions {
  dir?: string;
  description?: string;
  force?: boolean;
}

export async function init(name: string, options: InitCommandOptions = {}): Promise<void> {
  const spinner = createSpinner(`Initializing ${chalk.cyan(name)}...`);
  try {
    const createdDir = initSkill(name, {
      dir: options.dir,
      description: options.description,
      force: Boolean(options.force)
    });
    spinner.succeed(`Created ${chalk.green(name)} at ${chalk.dim(createdDir)}`);
    console.log(chalk.dim(`Next: cd ${createdDir} && skild validate .`));
  } catch (error: unknown) {
    spinner.fail(`Failed to init ${chalk.red(name)}`);
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

