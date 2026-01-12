import chalk from 'chalk';
import { PLATFORMS, listAllSkills, listSkills, type Platform } from '@skild/core';

export interface ListCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function list(options: ListCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';

  const platform = options.target as Platform | undefined;
  if (platform) {
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
      const displayName = s.record?.canonicalName || s.name;
      console.log(`  ${status} ${chalk.cyan(displayName)}`);
      console.log(chalk.dim(`    └─ ${s.installDir}`));
    }
    console.log('');
    return;
  }

  const allSkills = listAllSkills({ scope });

  if (options.json) {
    console.log(JSON.stringify(allSkills, null, 2));
    return;
  }

  if (allSkills.length === 0) {
    console.log(chalk.dim('No skills installed.'));
    console.log(chalk.dim(`Use ${chalk.cyan('skild install <source>')} to install a skill.`));
    return;
  }

  console.log(chalk.bold(`\n📦 Installed Skills — all platforms (${scope}):\n`));
  for (const p of PLATFORMS) {
    const platformSkills = allSkills
      .filter(s => s.platform === p)
      .sort((a, b) => a.name.localeCompare(b.name));

    const header = `${p} (${platformSkills.length})`;
    console.log(chalk.bold(`  ${header}`));
    if (platformSkills.length === 0) {
      console.log(chalk.dim('    (none)'));
      continue;
    }
    for (const s of platformSkills) {
      const status = s.hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
      const displayName = s.record?.canonicalName || s.name;
      console.log(`    ${status} ${chalk.cyan(displayName)}`);
      console.log(chalk.dim(`      └─ ${s.installDir}`));
    }
  }
  console.log('');
}
