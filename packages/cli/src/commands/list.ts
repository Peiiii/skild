import chalk from 'chalk';
import { listSkills, type Platform } from '@skild/core';

export interface ListCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function list(options: ListCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';

  const skills = listSkills({ platform, scope });

  if (options.json) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  if (skills.length === 0) {
    console.log(chalk.dim('No skills installed.'));
    console.log(chalk.dim(`Use ${chalk.cyan('skild install <source>')} to install a skill.`));
    return;
  }

  console.log(chalk.bold(`\n📦 Installed Skills (${skills.length}) — ${platform} (${scope}):\n`));
  for (const s of skills) {
    const status = s.hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
    console.log(`  ${status} ${chalk.cyan(s.name)}`);
    console.log(chalk.dim(`    └─ ${s.installDir}`));
  }
  console.log('');
}

