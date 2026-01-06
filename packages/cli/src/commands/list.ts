import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { SKILLS_DIR, ensureSkillsDir } from '../utils/config.js';

export async function list(): Promise<void> {
    ensureSkillsDir();

    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    const skills = entries.filter(e => e.isDirectory());

    if (skills.length === 0) {
        console.log(chalk.dim('No skills installed.'));
        console.log(chalk.dim(`Use ${chalk.cyan('skild install <url>')} to install a skill.`));
        return;
    }

    console.log(chalk.bold(`\n📦 Installed Skills (${skills.length}):\n`));

    for (const skill of skills) {
        const skillPath = path.join(SKILLS_DIR, skill.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        const hasSkillMd = fs.existsSync(skillMdPath);

        const status = hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${status} ${chalk.cyan(skill.name)}`);
        console.log(chalk.dim(`    └─ ${skillPath}`));
    }

    console.log('');
}
