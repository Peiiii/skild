import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import degit from 'degit';
import { ensureSkillsDir, getSkillPath, Platform } from '../utils/config.js';

export interface InstallOptions {
    target?: Platform;
    local?: boolean;
}

/**
 * Extract a reasonable skill name from a source (URL/degit shorthand/local path).
 * Examples:
 *   https://github.com/anthropics/skills/tree/main/pdf -> pdf
 *   https://github.com/user/skill-name -> skill-name
 *   anthropics/skills/pdf#main -> pdf
 */
function extractSkillName(url: string): string {
    // Handle local paths
    const maybeLocalPath = path.resolve(url);
    if (fs.existsSync(maybeLocalPath)) {
        return path.basename(maybeLocalPath) || 'unknown-skill';
    }

    const cleaned = url.replace(/[#?].*$/, '');

    // Handle tree URLs (subdirectory)
    const treeMatch = cleaned.match(/\/tree\/[^/]+\/(.+?)(?:\/)?$/);
    if (treeMatch) {
        return treeMatch[1].split('/').pop() || 'unknown-skill';
    }

    // Handle standard repo URLs
    const repoMatch = cleaned.match(/github\.com\/[^/]+\/([^/]+)/);
    if (repoMatch) {
        return repoMatch[1].replace(/\.git$/, '');
    }

    // Handle degit shorthand (owner/repo[/subpath])
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length >= 2) {
        return parts[parts.length - 1] || 'unknown-skill';
    }

    return cleaned || 'unknown-skill';
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

function isDirEmpty(dir: string): boolean {
    try {
        const entries = fs.readdirSync(dir);
        return entries.length === 0;
    } catch {
        return true;
    }
}

function addSkillsPrefixFallback(degitSrc: string): string | null {
    const [pathPart, refPart] = degitSrc.split('#');
    const parts = (pathPart || '').split('/').filter(Boolean);
    if (parts.length < 3) return null;

    const [owner, repo, ...subpath] = parts;
    if (subpath[0] === 'skills') return null;

    const next = `${owner}/${repo}/skills/${subpath.join('/')}${refPart ? `#${refPart}` : ''}`;
    return next === degitSrc ? null : next;
}

async function cloneRemote(degitSrc: string, targetPath: string): Promise<void> {
    const emitter = degit(degitSrc, { force: true, verbose: false });
    await emitter.clone(targetPath);
}

export async function install(source: string, options: InstallOptions = {}): Promise<void> {
    const platform = options.target || 'claude';
    const projectLevel = options.local || false;

    ensureSkillsDir(platform, projectLevel);

    const skillName = extractSkillName(source);
    const targetPath = getSkillPath(skillName, platform, projectLevel);

    const locationLabel = projectLevel ? 'project' : 'global';
    const spinner = ora(`Installing ${chalk.cyan(skillName)} to ${chalk.dim(platform)} (${locationLabel})...`).start();

    try {
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        }

        const resolvedSource = path.resolve(source);
        if (fs.existsSync(resolvedSource)) {
            const stat = fs.statSync(resolvedSource);
            if (!stat.isDirectory()) {
                throw new Error(`Source path is not a directory: ${resolvedSource}`);
            }

            fs.cpSync(resolvedSource, targetPath, { recursive: true });
        } else {
            // "Registry name" (no slashes, not a URL) is not supported yet.
            const looksLikeUrl = /^[a-z]+:\/\//i.test(source) || source.includes('github.com');
            const looksLikeRepo = /^[^/]+\/[^/]+/.test(source);
            if (!looksLikeUrl && !looksLikeRepo) {
                throw new Error(
                    `Unsupported source "${source}". Use a Git URL (e.g. https://github.com/owner/repo) or degit shorthand (e.g. owner/repo[/subdir][#ref]).`
                );
            }

            const degitPath = toDegitPath(source);
            await cloneRemote(degitPath, targetPath);

            if (isDirEmpty(targetPath)) {
                const fallback = addSkillsPrefixFallback(degitPath);
                if (fallback) {
                    await cloneRemote(fallback, targetPath);
                }
            }
        }

        if (isDirEmpty(targetPath)) {
            throw new Error(
                `Installed directory is empty. Source might not point to a valid subdirectory. Try a GitHub tree URL like https://github.com/<owner>/<repo>/tree/<branch>/skills/<skill-name>.`
            );
        }

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
