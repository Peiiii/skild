import chalk from 'chalk';
import { PLATFORMS, listAllSkills, listSkills, type Platform } from '@skild/core';

export interface ListCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
  paths?: boolean;
  verbose?: boolean;
}

type Listed = ReturnType<typeof listSkills>[number];

function isSkillset(skill: Listed): boolean {
  return Boolean(skill.record?.skillset || skill.record?.skill?.frontmatter?.skillset);
}

function getDisplayName(skill: Listed): string {
  return (
    skill.record?.canonicalName ||
    skill.record?.skill?.frontmatter?.name ||
    skill.name
  );
}

function buildNameToDisplay(skills: Listed[]): Map<string, string> {
  const mapping = new Map<string, string>();
  for (const skill of skills) {
    mapping.set(skill.name, getDisplayName(skill));
  }
  return mapping;
}

function statusIcon(skill: Listed): string {
  return skill.hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
}

function missingSkillMdLabel(skill: Listed): string {
  return skill.hasSkillMd ? '' : chalk.yellow(' (missing SKILL.md)');
}

function formatDepName(dep: { name: string; canonicalName?: string }, nameToDisplay: Map<string, string>): string {
  return dep.canonicalName || nameToDisplay.get(dep.name) || dep.name;
}

function printSkillsetSection(skills: Listed[], nameToDisplay: Map<string, string>, options: Required<Pick<ListCommandOptions, 'paths' | 'verbose'>>): void {
  console.log(chalk.bold(`  📦 Skillsets`) + chalk.dim(` (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    No skillsets'));
    return;
  }

  for (const s of skills) {
    const depsCount = s.record?.installedDependencies?.length || 0;
    const depsSuffix = depsCount > 0 ? chalk.dim(` → ${depsCount} deps`) : '';
    console.log(`    ${statusIcon(s)} ${chalk.cyan(getDisplayName(s))}${depsSuffix}${missingSkillMdLabel(s)}`);

    if (options.verbose) {
      const deps = (s.record?.installedDependencies || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      for (const dep of deps) {
        const depName = formatDepName(dep, nameToDisplay);
        console.log(chalk.dim(`        • ${depName}`));
      }
    }

    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      └─ ${s.installDir}`));
  }
}

function printSkillsSection(skills: Listed[], options: Required<Pick<ListCommandOptions, 'paths'>>): void {
  console.log(chalk.bold(`  ⚡ Skills`) + chalk.dim(` (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    No skills'));
    return;
  }
  for (const s of skills) {
    console.log(`    ${statusIcon(s)} ${chalk.cyan(getDisplayName(s))}${missingSkillMdLabel(s)}`);
    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      └─ ${s.installDir}`));
  }
}

function printDependenciesSection(skills: Listed[], nameToDisplay: Map<string, string>, options: Required<Pick<ListCommandOptions, 'paths'>>): void {
  console.log(chalk.bold(`  🔗 Dependencies`) + chalk.dim(` (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    No dependencies'));
    return;
  }
  for (const s of skills) {
    const dependedBy = (s.record?.dependedBy || [])
      .map(name => nameToDisplay.get(name) || name)
      .sort((a, b) => a.localeCompare(b));
    const requiredBy = dependedBy.length ? chalk.dim(` ← ${dependedBy.join(', ')}`) : '';
    console.log(`    ${statusIcon(s)} ${chalk.cyan(getDisplayName(s))}${requiredBy}${missingSkillMdLabel(s)}`);
    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      └─ ${s.installDir}`));
  }
}

function printPlatform(skills: Listed[], platform: string, scope: string, options: Required<Pick<ListCommandOptions, 'paths' | 'verbose'>>): void {
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
  console.log(chalk.bold(`\n${platformLabel}`) + chalk.dim(` (${scope}, ${skills.length} total)`));

  if (skills.length === 0) {
    console.log(chalk.dim('  No skills installed.'));
    console.log(chalk.dim(`  💡 Use ${chalk.cyan('skild install <source>')} to get started.`));
    return;
  }

  const nameToDisplay = buildNameToDisplay(skills);

  const skillsets = skills.filter(isSkillset).sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  const dependencies = skills
    .filter(s => !isSkillset(s) && Boolean(s.record?.dependedBy?.length))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  const regular = skills
    .filter(s => !isSkillset(s) && !Boolean(s.record?.dependedBy?.length))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

  if (skillsets.length > 0) {
    printSkillsetSection(skillsets, nameToDisplay, options);
  }
  if (regular.length > 0) {
    console.log('');
    printSkillsSection(regular, options);
  }
  if (dependencies.length > 0) {
    console.log('');
    printDependenciesSection(dependencies, nameToDisplay, options);
  }
  console.log('');
}

export async function list(options: ListCommandOptions = {}): Promise<void> {
  const scope = options.local ? 'project' : 'global';
  const paths = Boolean(options.paths);
  const verbose = Boolean(options.verbose);

  const platform = options.target as Platform | undefined;
  if (platform) {
    const skills = listSkills({ platform, scope });

    if (options.json) {
      console.log(JSON.stringify(skills, null, 2));
      return;
    }

    printPlatform(skills, platform, scope, { paths, verbose });
    return;
  }

  const allSkills = listAllSkills({ scope });

  if (options.json) {
    console.log(JSON.stringify(allSkills, null, 2));
    return;
  }

  if (allSkills.length === 0) {
    console.log(chalk.dim('\nNo skills installed.'));
    console.log(chalk.dim(`💡 Use ${chalk.cyan('skild install <source>')} to get started.\n`));
    return;
  }

  for (const p of PLATFORMS) {
    const platformSkills = allSkills
      .filter(s => s.platform === p)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (platformSkills.length === 0) continue;
    printPlatform(platformSkills, p, scope, { paths, verbose });
  }
}
