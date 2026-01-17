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
import { signup } from './commands/signup.js';
import { login } from './commands/login.js';
import { logout } from './commands/logout.js';
import { whoami } from './commands/whoami.js';
import { publish } from './commands/publish.js';
import { search } from './commands/search.js';
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
    .option('-t, --target <platform>', `Target platform: ${PLATFORMS.join(', ')}`)
    .option('--all', `Install to all platforms: ${PLATFORMS.join(', ')}`)
    .option('--recursive', 'If source is a multi-skill directory/repo, install all discovered skills')
    .option('-y, --yes', 'Skip confirmation prompts (assume yes)')
    .option('--depth <n>', 'Max markdown recursion depth (default: 0)', '0')
    .option('--scan-depth <n>', 'Max directory depth to scan for SKILL.md (default: 6)', '6')
    .option('--max-skills <n>', 'Max discovered skills to install (default: 200)', '200')
    .option('-l, --local', 'Install to project-level directory instead of global')
    .option('-f, --force', 'Overwrite existing installation')
    .option('--registry <url>', 'Registry base URL (default: https://registry.skild.sh)')
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
    .option('--paths', 'Show install paths')
    .option('--verbose', 'Show skillset dependency details')
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
    .option('--with-deps', 'Uninstall dependencies that are only required by this skill')
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

program
    .command('signup')
    .description('Create a publisher account in the registry (no GitHub required)')
    .option('--registry <url>', 'Registry base URL (default: https://registry.skild.sh)')
    .option('--email <email>', 'Email (optional; will prompt)')
    .option('--handle <handle>', 'Publisher handle (owns @handle/* scope) (optional; will prompt)')
    .option('--password <password>', 'Password (optional; will prompt)')
    .option('--json', 'Output JSON')
    .action(async (options: any) => signup(options));

program
    .command('login')
    .description('Login to a registry and store an access token locally')
    .option('--registry <url>', 'Registry base URL (default: https://registry.skild.sh)')
    .option('--handle-or-email <value>', 'Handle or email (optional; will prompt)')
    .option('--password <password>', 'Password (optional; will prompt)')
    .option('--token-name <name>', 'Token label')
    .option('--json', 'Output JSON')
    .action(async (options: any) => login(options));

program
    .command('logout')
    .description('Remove stored registry credentials')
    .action(async () => logout());

program
    .command('whoami')
    .description('Show current registry identity')
    .action(async () => whoami());

program
    .command('publish')
    .description('Publish a Skill directory to the registry (hosted tarball)')
    .option('--dir <path>', 'Skill directory (defaults to cwd)')
    .option('--name <@publisher/skill>', 'Override skill name (defaults to SKILL.md frontmatter)')
    // NOTE: Do not use `--version` here; it conflicts with Commander’s built-in `--version`.
    .option('--skill-version <semver>', 'Override version (defaults to SKILL.md frontmatter)')
    .option('--alias <alias>', 'Optional short identifier (global unique) for `skild install <alias>`')
    .option('--description <text>', 'Override description (defaults to SKILL.md frontmatter)')
    .option('--targets <list>', 'Comma-separated target platforms metadata (optional)')
    .option('--tag <tag>', 'Dist-tag (default: latest)', 'latest')
    .option('--registry <url>', 'Registry base URL (defaults to saved login)')
    .option('--json', 'Output JSON')
    .action(async (options: any) => publish(options));

program
    .command('search <query>')
    .description('Search Skills in the registry')
    .option('--registry <url>', 'Registry base URL (default: https://registry.skild.sh)')
    .option('--limit <n>', 'Max results (default: 50)', '50')
    .option('--json', 'Output JSON')
    .action(async (query: string, options: any) => search(query, options));

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
