/**
 * CLI Logger - Unified logging and spinner utilities
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * Create a spinner with the given message.
 */
export function createSpinner(message: string): Ora {
    return ora(message).start();
}

/**
 * Logger utilities for consistent CLI output.
 */
export const logger = {
    /**
     * Log a success message with green checkmark.
     */
    success: (message: string): void => {
        console.log(chalk.green('✓'), message);
    },

    /**
     * Log a warning message with yellow color.
     */
    warn: (message: string): void => {
        console.log(chalk.yellow('⚠'), message);
    },

    /**
     * Log an error message with red color.
     */
    error: (message: string): void => {
        console.error(chalk.red('✗'), message);
    },

    /**
     * Log an info message with cyan color.
     */
    info: (message: string): void => {
        console.log(chalk.cyan('ℹ'), message);
    },

    /**
     * Log a dimmed/subtle message.
     */
    dim: (message: string): void => {
        console.log(chalk.dim(message));
    },

    /**
     * Log a bold header.
     */
    header: (message: string): void => {
        console.log(chalk.bold(message));
    },

    /**
     * Log a skill entry with status indicator.
     */
    skillEntry: (name: string, path: string, hasSkillMd: boolean): void => {
        const status = hasSkillMd ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${status} ${chalk.cyan(name)}`);
        console.log(chalk.dim(`    └─ ${path}`));
    },

    /**
     * Log installation result details.
     */
    installDetail: (message: string, isWarning = false): void => {
        const color = isWarning ? chalk.yellow : chalk.dim;
        console.log(color(`  └─ ${message}`));
    },
};

export default logger;
