/**
 * Install Command - Install a skill from a source
 */

import chalk from 'chalk';
import { installSkillFromContext, resolveInstallContext } from '../services/skill-installer.js';
import { createSpinner, logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES } from '../constants.js';
import type { InstallOptions } from '../types/index.js';

// Re-export types for backward compatibility
export type { InstallOptions };

/**
 * Install a skill from a Git URL, degit shorthand, or local directory.
 * 
 * @param source - The source to install from
 * @param options - Installation options
 */
export async function install(source: string, options: InstallOptions = {}): Promise<void> {
    let context: ReturnType<typeof resolveInstallContext>;
    try {
        context = resolveInstallContext(source, options);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(message));
        process.exitCode = 1;
        return;
    }

    const spinner = createSpinner(
        `Installing ${chalk.cyan(context.skillName)} to ${chalk.dim(context.platform)} (${context.locationLabel})...`
    );

    try {
        const result = await installSkillFromContext(context);
        spinner.succeed(`Installed ${chalk.green(result.skillName)} to ${chalk.dim(result.targetPath)}`);
        if (result.hasSkillMd) {
            logger.installDetail(SUCCESS_MESSAGES.SKILL_MD_FOUND);
        } else {
            logger.installDetail(SUCCESS_MESSAGES.SKILL_MD_WARNING, true);
        }
    } catch (error: unknown) {
        spinner.fail(`Failed to install ${chalk.red(context.skillName)}`);
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(message));
        process.exitCode = 1;
    }
}
