import chalk from 'chalk';
import { validateSkill, type Platform } from '@skild/core';

export interface ValidateCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function validate(target: string | undefined, options: ValidateCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';
  const value = target || '.';

  const result = validateSkill(value, { platform, scope });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (result.ok) {
    console.log(chalk.green('✓'), 'Valid skill');
    if (result.frontmatter?.name) console.log(chalk.dim(`  name: ${result.frontmatter.name}`));
    return;
  }

  console.error(chalk.red('✗'), 'Invalid skill');
  for (const issue of result.issues) {
    const color = issue.level === 'error' ? chalk.red : chalk.yellow;
    console.error(`  - ${color(issue.level)}: ${issue.message}`);
  }
  process.exitCode = 1;
}

