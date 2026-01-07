import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { DEFAULT_PLATFORM, ensureSkillsDir, Platform } from '../utils/config.js';

export interface ListOptions {
    target?: Platform;
    local?: boolean;
}

export async function list(options: ListOptions = {}): Promise<void> {
    const platform = options.target || DEFAULT_PLATFORM;
    const projectLevel = options.local || false;
    const skillsDir = ensureSkillsDir(platform, projectLevel);

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skills = entries.filter(e => e.isDirectory());

    if (skills.length === 0) {
        console.log(chalk.dim('No skills installed.'));
        console.log(chalk.dim(`Use ${chalk.cyan('skild install <url>')} to install a skill.`));
        return;
    }

    const locationLabel = projectLevel ? 'project' : 'global';
    console.log(chalk.bold(`\n📦 Installed Skills (${skills.length}) — ${platform} (${locationLabel}):\n`));

    for (const skill of skills) {
        const skillPath = path.join(skillsDir, skill.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        const hasSkillMd = fs.existsSync(skillMdPath);

        const status = hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${status} ${chalk.cyan(skill.name)}`);
        console.log(chalk.dim(`    └─ ${skillPath}`));
    }

    console.log('');
}
