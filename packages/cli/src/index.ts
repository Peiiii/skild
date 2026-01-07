#!/usr/bin/env node

/**
 * Skild CLI - The npm for Agent Skills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { install } from './commands/install.js';
import { list } from './commands/list.js';
import { isPlatform } from './types/index.js';
import { DEFAULT_PLATFORM } from './constants.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
    .name('skild')
    .description('The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease.')
    .version(version);

program
    .command('install <source>')
    .alias('i')
    .description('Install a Skill from a Git URL, degit shorthand, or local directory')
    .option('-t, --target <platform>', 'Target platform: claude, codex, copilot', DEFAULT_PLATFORM)
    .option('-l, --local', 'Install to project-level directory instead of global')
    .action(async (source: string, options: { target?: string; local?: boolean }) => {
        const platform = isPlatform(options.target) ? options.target : DEFAULT_PLATFORM;
        await install(source, {
            target: platform,
            local: options.local
        });
    });

program
    .command('list')
    .alias('ls')
    .description('List installed Skills')
    .option('-t, --target <platform>', 'Target platform: claude, codex, copilot', DEFAULT_PLATFORM)
    .option('-l, --local', 'List project-level directory instead of global')
    .action(async (options: { target?: string; local?: boolean }) => {
        const platform = isPlatform(options.target) ? options.target : DEFAULT_PLATFORM;
        await list({
            target: platform,
            local: options.local
        });
    });

// Default action: show help
program.action(() => {
    console.log(chalk.bold('\n🛡️ skild — Get your agents skilled.\n'));
    program.outputHelp();
});

// pnpm sometimes forwards an extra "--" when passing args to scripts.
// Example: `pnpm cli -- install ...` becomes `node ... -- install ...`.
// Strip the leading terminator so commander can parse subcommand options.
const argv = process.argv.slice();
if (argv[2] === '--') argv.splice(2, 1);

program.parse(argv);
