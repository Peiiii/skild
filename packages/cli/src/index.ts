#!/usr/bin/env node

/**
 * Skild CLI - The npm for Agent Skills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { install } from './commands/install.js';
import { list } from './commands/list.js';
import { info } from './commands/info.js';
import { uninstall } from './commands/uninstall.js';
import { update } from './commands/update.js';
import { validate } from './commands/validate.js';
import { init } from './commands/init.js';
import { PLATFORMS } from '@skild/core';

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
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`, 'claude')
    .option('-l, --local', 'Install to project-level directory instead of global')
    .option('-f, --force', 'Overwrite existing installation')
    .option('--json', 'Output JSON')
    .action(async (source: string, options: { target?: string; local?: boolean }) => {
        await install(source, options as any);
    });

program
    .command('list')
    .alias('ls')
    .description('List installed Skills')
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')} (optional; omit to list all)`)
    .option('-l, --local', 'List project-level directory instead of global')
    .option('--json', 'Output JSON')
    .action(async (options: any) => list(options));

program
    .command('info <skill>')
    .description('Show installed Skill details')
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`, 'claude')
    .option('-l, --local', 'Use project-level directory instead of global')
    .option('--json', 'Output JSON')
    .action(async (skill: string, options: any) => info(skill, options));

program
    .command('uninstall <skill>')
    .alias('rm')
    .description('Uninstall a Skill')
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`, 'claude')
    .option('-l, --local', 'Use project-level directory instead of global')
    .option('-f, --force', 'Uninstall even if metadata is missing')
    .action(async (skill: string, options: any) => uninstall(skill, options));

program
    .command('update [skill]')
    .alias('up')
    .description('Update one or all installed Skills')
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`, 'claude')
    .option('-l, --local', 'Use project-level directory instead of global')
    .option('--json', 'Output JSON')
    .action(async (skill: string | undefined, options: any) => update(skill, options));

program
    .command('validate [target]')
    .alias('v')
    .description('Validate a Skill folder (path) or an installed Skill name')
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`, 'claude')
    .option('-l, --local', 'Use project-level directory instead of global')
    .option('--json', 'Output JSON')
    .action(async (target: string | undefined, options: any) => validate(target, options));

program
    .command('init <name>')
    .description('Create a new Skill project')
    .option('--dir <path>', 'Target directory (defaults to <name>)')
    .option('--description <text>', 'Skill description')
    .option('-f, --force', 'Overwrite target directory if it exists')
    .action(async (name: string, options: any) => init(name, options));

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
