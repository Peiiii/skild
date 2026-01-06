#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { install } from './commands/install.js';
import { list } from './commands/list.js';

const program = new Command();

program
    .name('skild')
    .description('The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease.')
    .version('0.0.1');

program
    .command('install <source>')
    .alias('i')
    .description('Install a Skill from a GitHub URL or registry name')
    .option('-t, --target <platform>', 'Target platform: claude, codex, copilot', 'claude')
    .option('-l, --local', 'Install to project-level directory instead of global')
    .action(async (source: string, options: { target?: string; local?: boolean }) => {
        await install(source, {
            target: options.target as any,
            local: options.local
        });
    });

program
    .command('list')
    .alias('ls')
    .description('List installed Skills')
    .action(async () => {
        await list();
    });

// Default action: show help
program.action(() => {
    console.log(chalk.bold('\n🛡️ skild — Get your agents skilled.\n'));
    program.outputHelp();
});

program.parse();
