import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { SKILLS_DIR, ensureSkillsDir, getSkillPath } from '../utils/config.js';

/**
 * Extract skill name from a GitHub URL.
 * Examples:
 *   https://github.com/anthropics/skills/tree/main/pdf -> pdf
 *   https://github.com/user/skill-name -> skill-name
 */
function extractSkillName(url: string): string {
    // Handle tree URLs (subdirectory)
    const treeMatch = url.match(/\/tree\/[^/]+\/(.+?)(?:\/)?$/);
    if (treeMatch) {
        return treeMatch[1].split('/').pop() || 'unknown-skill';
    }

    // Handle standard repo URLs
    const repoMatch = url.match(/github\.com\/[^/]+\/([^/]+)/);
    if (repoMatch) {
        return repoMatch[1].replace(/\.git$/, '');
    }

    return 'unknown-skill';
}

/**
 * Convert GitHub URL to degit-compatible format.
 * Examples:
 *   https://github.com/anthropics/skills/tree/main/pdf -> anthropics/skills/pdf#main
 *   https://github.com/user/repo -> user/repo
 */
function toDegitPath(url: string): string {
    // Handle tree URLs (subdirectory)
    const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)(?:\/)?$/);
    if (treeMatch) {
        const [, owner, repo, branch, subpath] = treeMatch;
        return `${owner}/${repo}/${subpath}#${branch}`;
    }

    // Handle standard repo URLs
    const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (repoMatch) {
        return repoMatch[1].replace(/\.git$/, '');
    }

    // Fallback: assume it's already in degit format
    return url;
}

export async function install(source: string): Promise<void> {
    ensureSkillsDir();

    const skillName = extractSkillName(source);
    const targetPath = getSkillPath(skillName);
    const degitPath = toDegitPath(source);

    const spinner = ora(`Installing ${chalk.cyan(skillName)}...`).start();

    try {
        // Use degit to clone (fast, no .git folder)
        execSync(`npx degit ${degitPath} "${targetPath}" --force`, {
            stdio: 'pipe',
        });

        spinner.succeed(`Installed ${chalk.green(skillName)} to ${chalk.dim(targetPath)}`);

        // Check for SKILL.md
        const skillMdPath = path.join(targetPath, 'SKILL.md');
        const hasSkillMd = fs.existsSync(skillMdPath);

        if (hasSkillMd) {
            console.log(chalk.dim(`  └─ SKILL.md found ✓`));
        } else {
            console.log(chalk.yellow(`  └─ Warning: No SKILL.md found`));
        }

    } catch (error: any) {
        spinner.fail(`Failed to install ${chalk.red(skillName)}`);
        console.error(chalk.red(error.message || error));
        process.exit(1);
    }
}
