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

function summarizeDeps(record: Listed['record']): string | null {
  const deps = record?.installedDependencies || [];
  if (deps.length === 0) return null;
  const byType = deps.reduce(
    (acc, d) => {
      acc.total += 1;
      if (d.sourceType === 'inline') acc.inline += 1;
      else acc.external += 1;
      acc.bySourceType[d.sourceType] = (acc.bySourceType[d.sourceType] || 0) + 1;
      return acc;
    },
    { total: 0, inline: 0, external: 0, bySourceType: {} as Record<string, number> }
  );

  const parts: string[] = [];
  if (byType.inline) parts.push(`${byType.inline} inline`);
  const externalParts = Object.entries(byType.bySourceType)
    .filter(([t]) => t !== 'inline')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, c]) => `${c} ${t}`);
  if (externalParts.length) parts.push(...externalParts);

  return `deps: ${byType.total}${parts.length ? ` (${parts.join(', ')})` : ''}`;
}

function printSkillsetSection(skills: Listed[], nameToDisplay: Map<string, string>, options: Required<Pick<ListCommandOptions, 'paths' | 'verbose'>>): void {
  console.log(chalk.bold(`  Skillsets (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    (none)'));
    return;
  }

  for (const s of skills) {
    const label = `${chalk.cyan(getDisplayName(s))}${chalk.dim(' (skillset)')}${missingSkillMdLabel(s)}`;
    console.log(`    ${statusIcon(s)} ${label}`);

    const summary = summarizeDeps(s.record);
    if (summary) console.log(chalk.dim(`      ${summary}`));

    if (options.verbose) {
      const deps = (s.record?.installedDependencies || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      if (deps.length) {
        console.log(chalk.dim(`      includes (${deps.length}):`));
        for (const dep of deps) {
          const depName = formatDepName(dep, nameToDisplay);
          console.log(chalk.dim(`        - ${depName} [${dep.sourceType}]`));
        }
      }
    }

    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      path: ${s.installDir}`));
  }
}

function printSkillsSection(skills: Listed[], options: Required<Pick<ListCommandOptions, 'paths'>>): void {
  console.log(chalk.bold(`  Skills (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    (none)'));
    return;
  }
  for (const s of skills) {
    const label = `${chalk.cyan(getDisplayName(s))}${missingSkillMdLabel(s)}`;
    console.log(`    ${statusIcon(s)} ${label}`);
    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      path: ${s.installDir}`));
  }
}

function printDependenciesSection(skills: Listed[], nameToDisplay: Map<string, string>, options: Required<Pick<ListCommandOptions, 'paths'>>): void {
  console.log(chalk.bold(`  Dependencies (${skills.length})`));
  if (skills.length === 0) {
    console.log(chalk.dim('    (none)'));
    return;
  }
  for (const s of skills) {
    const dependedBy = (s.record?.dependedBy || [])
      .map(name => nameToDisplay.get(name) || name)
      .sort((a, b) => a.localeCompare(b));
    const requiredBy = dependedBy.length ? chalk.dim(`  ← required by: ${dependedBy.join(', ')}`) : '';
    const label = `${chalk.cyan(getDisplayName(s))}${missingSkillMdLabel(s)}${requiredBy}`;
    console.log(`    ${statusIcon(s)} ${label}`);
    if (options.paths || !s.hasSkillMd) console.log(chalk.dim(`      path: ${s.installDir}`));
  }
}

function printPlatform(skills: Listed[], platform: string, scope: string, options: Required<Pick<ListCommandOptions, 'paths' | 'verbose'>>): void {
  console.log(chalk.bold(`\n📦 Installed Skills — ${platform} (${scope})\n`));

  if (skills.length === 0) {
    console.log(chalk.dim('  No skills installed.'));
    console.log(chalk.dim(`  Use ${chalk.cyan('skild install <source>')} to install a skill.`));
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

  printSkillsetSection(skillsets, nameToDisplay, options);
  console.log('');
  printSkillsSection(regular, options);
  console.log('');
  printDependenciesSection(dependencies, nameToDisplay, options);
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
    console.log(chalk.dim('No skills installed.'));
    console.log(chalk.dim(`Use ${chalk.cyan('skild install <source>')} to install a skill.`));
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
