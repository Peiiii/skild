import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export type SpinnerInstance = Ora;

export const ui = {
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  info: (msg: string) => console.log(chalk.cyan('ℹ'), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),

  spinner: (msg: string): Ora => ora(msg).start(),

  bullet: (msg: string, indent = 0) => console.log('  '.repeat(indent) + chalk.dim('•'), msg),

  header: (msg: string) => console.log('\n' + chalk.bold(msg)),

  sectionHeader: (emoji: string, title: string, count?: number) => {
    const countStr = count !== undefined ? chalk.dim(` (${count})`) : '';
    console.log(`\n${emoji} ${chalk.bold(title)}${countStr}`);
  },

  br: () => console.log(),

  hint: (msg: string) => console.log(chalk.dim(`  💡 ${msg}`)),

  skillItem: (name: string, opts: { valid?: boolean; suffix?: string; indent?: number } = {}) => {
    const { valid = true, suffix = '', indent = 0 } = opts;
    const icon = valid ? chalk.green('✓') : chalk.yellow('⚠');
    const indentStr = '  '.repeat(indent);
    const suffixStr = suffix ? chalk.dim(` ${suffix}`) : '';
    console.log(`${indentStr}  ${icon} ${chalk.cyan(name)}${suffixStr}`);
  },

  skillPath: (path: string, indent = 0) => {
    const indentStr = '  '.repeat(indent);
    console.log(chalk.dim(`${indentStr}    └─ ${path}`));
  },

  listItem: (msg: string, indent = 0) => {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}  ${chalk.dim('-')} ${msg}`);
  },

  progress: (current: number, total: number, msg: string) => {
    return `${msg} ${chalk.dim(`(${current}/${total})`)}`;
  },

  keyValue: (key: string, value: string, indent = 0) => {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}${chalk.dim(key + ':')} ${value}`);
  },

  box: (title: string, lines: string[]) => {
    console.log();
    console.log(chalk.bold(title));
    for (const line of lines) {
      console.log(chalk.dim('  ' + line));
    }
  },

  emptyState: (msg: string, hint?: string) => {
    console.log(chalk.dim(`  ${msg}`));
    if (hint) {
      console.log(chalk.dim(`  Use ${chalk.cyan(hint)} to get started.`));
    }
  },

  table: {
    row: (cols: string[], widths: number[]) => {
      const formatted = cols.map((col, i) => {
        const width = widths[i] || 20;
        return col.padEnd(width);
      });
      console.log('  ' + formatted.join(''));
    },
    separator: (widths: number[]) => {
      const line = widths.map(w => '─'.repeat(w)).join('');
      console.log(chalk.dim('  ' + line));
    },
  },

  formatCount: (count: number, singular: string, plural?: string) => {
    const p = plural || singular + 's';
    return `${count} ${count === 1 ? singular : p}`;
  },

  formatPlatforms: (platforms: string[]) => {
    if (platforms.length === 4) return chalk.dim('all platforms');
    if (platforms.length === 1) return chalk.dim(platforms[0]);
    return chalk.dim(`${platforms.length} platforms`);
  },
};

export const fmt = {
  cyan: chalk.cyan,
  green: chalk.green,
  yellow: chalk.yellow,
  red: chalk.red,
  dim: chalk.dim,
  bold: chalk.bold,

  name: (s: string) => chalk.cyan(s),
  path: (s: string) => chalk.dim(s),
  count: (n: number) => chalk.bold(String(n)),
  platform: (s: string) => chalk.dim(s),
};

export { createSpinner } from '../utils/logger.js';

