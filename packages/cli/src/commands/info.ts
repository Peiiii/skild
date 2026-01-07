import chalk from 'chalk';
import { getSkillInfo, SkildError, type Platform } from '@skild/core';

export interface InfoCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function info(skill: string, options: InfoCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';

  try {
    const record = getSkillInfo(skill, { platform, scope });
    if (options.json) {
      console.log(JSON.stringify(record, null, 2));
      return;
    }

    console.log(chalk.bold(`\n${chalk.cyan(record.name)}\n`));
    console.log(`  ${chalk.dim('Path:')} ${record.installDir}`);
    console.log(`  ${chalk.dim('Source:')} ${record.source}`);
    console.log(`  ${chalk.dim('Target:')} ${record.platform} (${record.scope})`);
    console.log(`  ${chalk.dim('Installed:')} ${record.installedAt}`);
    if (record.updatedAt) console.log(`  ${chalk.dim('Updated:')} ${record.updatedAt}`);
    console.log(`  ${chalk.dim('Hash:')} ${record.contentHash}`);
    console.log(`  ${chalk.dim('SKILL.md:')} ${record.hasSkillMd ? chalk.green('yes') : chalk.yellow('no')}`);

    const validation = record.skill?.validation;
    if (validation) {
      console.log(`  ${chalk.dim('Validate:')} ${validation.ok ? chalk.green('ok') : chalk.red('failed')}`);
      if (!validation.ok) {
        for (const issue of validation.issues) {
          const color = issue.level === 'error' ? chalk.red : chalk.yellow;
          console.log(`    - ${color(issue.level)}: ${issue.message}`);
        }
      }
    }

    console.log('');
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

