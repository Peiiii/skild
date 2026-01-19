import readline from 'readline';
import chalk from 'chalk';
import stringWidth from 'string-width';

export type SelectionState = 'all' | 'none' | 'partial';

export interface SelectionInfo {
  state: SelectionState;
  selectedCount: number;
}

export type TreeNode = {
  id: string;
  name: string;
  depth: number;
  children: TreeNode[];
  leafIndices: number[];
  isLeaf: boolean;
};

export interface TreeSelectOptions<T> {
  title: string;
  subtitle: string;
  buildTree: (items: T[]) => TreeNode;
  formatNode: (node: TreeNode, selection: SelectionInfo, isCursor: boolean, maxWidth: number) => string;
  defaultAll: boolean;
  defaultSelected?: Set<number>;
}

interface TerminalRenderer {
  renderContent: () => string[];
  getLineCount: () => number;
}

// ----------------------------------------------------------------------------
// Shared TTY Session (alt screen + post-prompt logs)
// ----------------------------------------------------------------------------

let altScreenRefCount = 0;
let altScreenActive = false;
let altScreenExitTimer: NodeJS.Timeout | null = null;
let altScreenStdout: NodeJS.WriteStream | null = null;
const postPromptLogs: string[] = [];

export function enqueuePostPromptLog(message: string): void {
  postPromptLogs.push(message);
}

function flushPostPromptLogs(stdout: NodeJS.WriteStream): void {
  if (altScreenActive) return;
  if (postPromptLogs.length === 0) return;
  for (const msg of postPromptLogs.splice(0)) {
    stdout.write(msg.endsWith('\n') ? msg : msg + '\n');
  }
}

function enterAltScreen(stdout: NodeJS.WriteStream): void {
  if (altScreenExitTimer) {
    clearTimeout(altScreenExitTimer);
    altScreenExitTimer = null;
  }
  altScreenStdout = stdout;
  if (!altScreenActive) {
    stdout.write('\x1B[?1049h'); // Switch to alt screen
    stdout.write('\x1B[H'); // Move to top-left
    stdout.write('\x1B[2J'); // Clear
    altScreenActive = true;
  }
  altScreenRefCount += 1;
}

function exitAltScreenDeferred(): void {
  if (altScreenExitTimer) return;
  const stdout = altScreenStdout;
  if (!stdout) return;
  altScreenExitTimer = setTimeout(() => {
    altScreenExitTimer = null;
    if (altScreenRefCount !== 0) return;
    if (!altScreenActive) return;
    stdout.write('\x1B[?1049l'); // Exit alt screen (restores previous content)
    altScreenActive = false;
    flushPostPromptLogs(stdout);
  }, 200);
}

function leaveAltScreen(stdout: NodeJS.WriteStream): void {
  if (altScreenStdout && altScreenStdout !== stdout) {
    // Different stream; best-effort: close current screen immediately.
    altScreenStdout.write('\x1B[?1049l');
    altScreenActive = false;
    altScreenStdout = stdout;
  }
  altScreenRefCount = Math.max(0, altScreenRefCount - 1);
  if (altScreenRefCount === 0) exitAltScreenDeferred();
}

export function flushInteractiveUiNow(): void {
  const stdout = altScreenStdout || process.stdout;
  if (altScreenExitTimer) {
    clearTimeout(altScreenExitTimer);
    altScreenExitTimer = null;
  }
  if (altScreenRefCount !== 0) return;
  if (altScreenActive) {
    stdout.write('\x1B[?1049l');
    altScreenActive = false;
  }
  flushPostPromptLogs(stdout);
}

// ----------------------------------------------------------------------------
// Core: Tree selection state + rendering + viewport
// ----------------------------------------------------------------------------

function getNodeSelection(node: TreeNode, selected: Set<number>): SelectionInfo {
  const total = node.leafIndices.length;
  if (total === 0) return { state: 'none', selectedCount: 0 };

  let selectedCount = 0;
  for (const idx of node.leafIndices) {
    if (selected.has(idx)) selectedCount += 1;
  }

  let state: SelectionState = 'none';
  if (selectedCount === total) state = 'all';
  else if (selectedCount > 0) state = 'partial';

  return { state, selectedCount };
}

function flattenTree(root: TreeNode): TreeNode[] {
  const result: TreeNode[] = [];

  function walk(node: TreeNode) {
    if (node.id !== '') result.push(node);
    for (const child of node.children) walk(child);
  }

  for (const child of root.children) walk(child);
  return result;
}

function createRenderer(
  title: string,
  subtitle: string,
  flatNodes: TreeNode[],
  selected: Set<number>,
  getCursor: () => number,
  getViewOffset: () => number,
  viewHeight: number,
  maxWidth: number,
  formatNode: (node: TreeNode, selection: SelectionInfo, isCursor: boolean, maxWidth: number) => string
): TerminalRenderer {
  function renderContent(): string[] {
    const lines: string[] = [];
    lines.push(chalk.bold.cyan(title));
    lines.push(chalk.dim(subtitle));
    lines.push(''); // blank line

    const cursor = getCursor();
    const offset = getViewOffset();
    const end = Math.min(flatNodes.length, offset + viewHeight);

    for (let i = offset; i < end; i++) {
      const node = flatNodes[i]!;
      const selection = getNodeSelection(node, selected);
      lines.push(formatNode(node, selection, i === cursor, maxWidth));
    }

    lines.push(''); // blank line
    lines.push(chalk.dim(`Space toggle • Enter confirm • A select all • Ctrl+C cancel`));
    lines.push(chalk.dim(`Showing ${end - offset}/${flatNodes.length} (offset ${offset + 1})`));
    return lines;
  }

  function getLineCount(): number {
    // title + subtitle + blank + visible nodes + blank + footer(2)
    return 6 + Math.min(viewHeight, flatNodes.length);
  }

  return { renderContent, getLineCount };
}

function writeToTerminal(stdout: NodeJS.WriteStream, lines: string[]): void {
  for (const line of lines) {
    stdout.write(line + '\n');
  }
}

function clearAndRerender(stdout: NodeJS.WriteStream, lines: string[]): void {
  stdout.write('\x1B[?25l'); // Hide cursor
  stdout.write('\x1B[H'); // Move to top-left
  stdout.write('\x1B[2J'); // Clear entire screen
  writeToTerminal(stdout, lines);
}

export async function interactiveTreeSelect<T>(
  items: T[],
  options: TreeSelectOptions<T>
): Promise<number[] | null> {
  const { title, subtitle, buildTree, formatNode, defaultAll, defaultSelected } = options;

  const root = buildTree(items);
  const flatNodes = flattenTree(root);
  if (flatNodes.length === 0) return null;

  const stdin = process.stdin;
  const stdout = process.stdout;

  // Non-interactive fallback
  if (!stdin.isTTY || !stdout.isTTY) {
    if (defaultSelected) return Array.from(defaultSelected);
    return defaultAll ? items.map((_, i) => i) : null;
  }

  const cols = typeof stdout.columns === 'number' ? stdout.columns : 120;
  const rows = typeof stdout.rows === 'number' ? stdout.rows : 24;
  const viewHeight = Math.max(5, rows - 8); // title/subtitle/blank/footer
  const maxWidth = Math.max(40, cols - 2);

  // Initialize selection
  const selected = new Set<number>();
  if (defaultSelected) {
    for (const idx of defaultSelected) selected.add(idx);
  } else if (defaultAll) {
    for (let i = 0; i < items.length; i++) selected.add(i);
  }

  let cursor = 0;
  let viewOffset = 0;

  // Setup raw mode
  const wasRaw = Boolean((stdin as any).isRaw);
  stdin.setRawMode(true);
  stdin.resume();
  readline.emitKeypressEvents(stdin);

  enterAltScreen(stdout);

  const renderer = createRenderer(
    title,
    subtitle,
    flatNodes,
    selected,
    () => cursor,
    () => viewOffset,
    viewHeight,
    maxWidth,
    formatNode
  );

  clearAndRerender(stdout, renderer.renderContent());

  return new Promise<number[] | null>((resolve) => {
    function cleanup() {
      stdin.setRawMode(wasRaw);
      stdin.pause();
      stdin.removeListener('keypress', onKeypress);
      stdout.write('\x1B[?25h'); // Show cursor
      leaveAltScreen(stdout);
    }

    function rerender() {
      clearAndRerender(stdout, renderer.renderContent());
    }

    function toggleNode(node: TreeNode) {
      const { state } = getNodeSelection(node, selected);
      const shouldSelectAll = state !== 'all';
      if (shouldSelectAll) {
        for (const idx of node.leafIndices) selected.add(idx);
      } else {
        for (const idx of node.leafIndices) selected.delete(idx);
      }
    }

    function toggleAll() {
      if (selected.size === items.length) {
        selected.clear();
      } else {
        for (let i = 0; i < items.length; i++) selected.add(i);
      }
    }

    function onKeypress(_str: string | undefined, key: readline.Key) {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        resolve(null);
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        resolve(selected.size > 0 ? Array.from(selected) : null);
        return;
      }

      if (key.name === 'up') {
        if (cursor === 0) return;
        cursor -= 1;
        if (cursor < viewOffset) viewOffset = cursor;
        rerender();
        return;
      }

      if (key.name === 'down') {
        if (cursor === flatNodes.length - 1) return;
        cursor += 1;
        if (cursor >= viewOffset + viewHeight) viewOffset = cursor - viewHeight + 1;
        rerender();
        return;
      }

      if (key.name === 'space') {
        toggleNode(flatNodes[cursor]!);
        rerender();
        return;
      }

      if (key.name === 'a') {
        toggleAll();
        rerender();
        return;
      }
    }

    stdin.on('keypress', onKeypress);
  });
}

// ----------------------------------------------------------------------------
// Formatting helpers (optional, but encourages reuse)
// ----------------------------------------------------------------------------

function truncateVisible(value: string, maxLen: number): string {
  let width = 0;
  let result = '';
  for (const ch of value) {
    const w = stringWidth(ch);
    if (width + w > maxLen - 1) {
      result += '…';
      return result;
    }
    width += w;
    result += ch;
  }
  return result;
}

function truncateMiddleVisible(value: string, maxLen: number): string {
  if (stringWidth(value) <= maxLen) return value;
  if (maxLen <= 1) return '…';

  const leftMax = Math.max(1, Math.floor((maxLen - 1) / 2));
  const rightMax = Math.max(1, maxLen - 1 - leftMax);

  const left = truncateVisible(value, leftMax).replace(/…$/, '');
  let width = 0;
  let right = '';
  for (let i = value.length - 1; i >= 0; i--) {
    const ch = value[i]!;
    const w = stringWidth(ch);
    if (width + w > rightMax) break;
    width += w;
    right = ch + right;
  }
  if (!right) right = value[value.length - 1] || '';
  return `${left}…${right}`;
}

export function formatInteractiveRow(input: {
  cursorMark: string;
  indent: string;
  glyph: string;
  name: string;
  count: string;
  suffixText?: string;
  hintText?: string;
  isCursor: boolean;
  maxWidth: number;
  styleName?: (s: string) => string;
}): string {
  const styleName = input.styleName || ((s: string) => s);
  const prefix = `${input.cursorMark}${input.indent}${input.glyph} `;
  const fixedWidth = stringWidth(prefix) + stringWidth(input.count);

  let rawName = input.name;
  let rawSuffix = input.suffixText || '';
  let rawHint = input.hintText || '';

  const fits = (n: string, s: string, h: string) => {
    const nStyled = input.isCursor ? styleName(n) : n;
    const sStyled = s ? chalk.dim(s) : '';
    const hStyled = h ? chalk.dim(h) : '';
    return stringWidth(`${prefix}${nStyled}${input.count}${sStyled}${hStyled}`) <= input.maxWidth;
  };

  // Prefer keeping name; shrink suffix then hint then name.
  if (rawSuffix && !fits(rawName, rawSuffix, rawHint)) {
    const available = Math.max(1, input.maxWidth - fixedWidth - stringWidth(rawName) - stringWidth(rawHint));
    rawSuffix = truncateVisible(rawSuffix, available);
  }

  if (rawHint && !fits(rawName, rawSuffix, rawHint)) {
    const available = Math.max(1, input.maxWidth - fixedWidth - stringWidth(rawName) - stringWidth(rawSuffix));
    rawHint = truncateVisible(rawHint, available);
  }

  if (!fits(rawName, rawSuffix, rawHint)) {
    const available = Math.max(1, input.maxWidth - fixedWidth - stringWidth(rawSuffix) - stringWidth(rawHint));
    rawName = truncateMiddleVisible(rawName, available);
  }

  const finalName = input.isCursor ? styleName(rawName) : rawName;
  const suffix = rawSuffix ? chalk.dim(rawSuffix) : '';
  const hint = rawHint ? chalk.dim(rawHint) : '';
  return `${prefix}${finalName}${input.count}${suffix}${hint}`;
}
