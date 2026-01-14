import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { PLATFORMS, listAllSkills, listSkills, type Platform } from '@skild/core';

type DisplayEntry = {
  name: string;
  installDir: string;
  status: 'ok' | 'warn';
  flags: string[];
};

function toDisplayName(name: string, mapping: Map<string, string>): string {
  return mapping.get(name) || name;
}

function buildDisplayEntries(skills: ReturnType<typeof listSkills>): DisplayEntry[] {
  const nameToDisplay = new Map<string, string>();
  for (const skill of skills) {
    const displayName = skill.record?.canonicalName || skill.name;
    nameToDisplay.set(skill.name, displayName);
  }

  const entries: DisplayEntry[] = skills.map(skill => {
    const displayName = toDisplayName(skill.name, nameToDisplay);
    const flags: string[] = [];
    if (skill.record?.skillset || skill.record?.skill?.frontmatter?.skillset) {
      flags.push('skillset');
    }
    if (skill.record?.dependedBy?.length) {
      const dependedBy = skill.record.dependedBy.map(name => toDisplayName(name, nameToDisplay));
      flags.push(`dep of: ${dependedBy.join(', ')}`);
    }
    return {
      name: displayName,
      installDir: skill.installDir,
      status: skill.hasSkillMd ? 'ok' : 'warn',
      flags
    };
  });

  for (const skill of skills) {
    const inlineDeps = skill.record?.installedDependencies?.filter(dep => dep.sourceType === 'inline') || [];
    if (!inlineDeps.length) continue;
    const ownerName = toDisplayName(skill.name, nameToDisplay);
    for (const dep of inlineDeps) {
      const inlineDir = dep.inlinePath
        ? path.join(skill.installDir, dep.inlinePath)
        : path.join(skill.installDir, dep.name);
      const hasSkillMd = fs.existsSync(path.join(inlineDir, 'SKILL.md'));
      entries.push({
        name: dep.name,
        installDir: inlineDir,
        status: hasSkillMd ? 'ok' : 'warn',
        flags: [`dep of: ${ownerName}`]
      });
    }
  }

  return entries;
}

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

    const entries = buildDisplayEntries(skills);
    console.log(chalk.bold(`\n📦 Installed Skills (${entries.length}) — ${platform} (${scope}):\n`));
    for (const entry of entries) {
      const status = entry.status === 'ok' ? chalk.green('✓') : chalk.yellow('⚠');
      const label = entry.flags.length ? `${entry.name} (${entry.flags.join('; ')})` : entry.name;
      console.log(`  ${status} ${chalk.cyan(label)}`);
      console.log(chalk.dim(`    └─ ${entry.installDir}`));
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

    const entries = buildDisplayEntries(platformSkills);
    const header = `${p} (${entries.length})`;
    console.log(chalk.bold(`  ${header}`));
    if (entries.length === 0) {
      console.log(chalk.dim('    (none)'));
      continue;
    }
    for (const entry of entries) {
      const status = entry.status === 'ok' ? chalk.green('✓') : chalk.yellow('⚠');
      const label = entry.flags.length ? `${entry.name} (${entry.flags.join('; ')})` : entry.name;
      console.log(`    ${status} ${chalk.cyan(label)}`);
      console.log(chalk.dim(`      └─ ${entry.installDir}`));
    }
  }
  console.log('');
}
