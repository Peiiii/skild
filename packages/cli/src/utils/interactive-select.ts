import readline from 'readline';
import chalk from 'chalk';
import type { Platform } from '@skild/core';
import { PLATFORMS } from '@skild/core';

// Platform display names
const PLATFORM_DISPLAY: Record<Platform, { name: string }> = {
    claude: { name: 'Claude' },
    codex: { name: 'Codex' },
    copilot: { name: 'Copilot' },
    antigravity: { name: 'Antigravity' },
};

export type SkillChoice = {
    relPath: string;
    suggestedSource: string;
    materializedDir?: string;
};

// --- Tree Node Structure ---
type TreeNode = {
    id: string;
    name: string;
    depth: number;
    children: TreeNode[];
    leafIndices: number[]; // Indices of skills under this node
    isLeaf: boolean;
};

function buildSkillTree(skills: SkillChoice[]): TreeNode {
    // Create "All Skills" as the root visible node
    const allNode: TreeNode = {
        id: 'all',
        name: 'All Skills',
        depth: 1,
        children: [],
        leafIndices: [],
        isLeaf: false
    };

    for (let i = 0; i < skills.length; i++) {
        const relPath = skills[i]!.relPath;
        const parts = relPath === '.' ? ['.'] : relPath.split('/').filter(Boolean);

        allNode.leafIndices.push(i);
        let current = allNode;

        for (let d = 0; d < parts.length; d++) {
            const part = parts[d]!;
            const nodeId = parts.slice(0, d + 1).join('/');
            let child = current.children.find(c => c.name === part);

            if (!child) {
                child = {
                    id: nodeId,
                    name: part,
                    depth: d + 2, // +2 because allNode is depth 1
                    children: [],
                    leafIndices: [],
                    isLeaf: d === parts.length - 1,
                };
                current.children.push(child);
            }
            child.leafIndices.push(i);
            current = child;
        }
    }

    const root: TreeNode = { id: '', name: '.', depth: 0, children: [allNode], leafIndices: allNode.leafIndices.slice(), isLeaf: false };
    return root;
}

function flattenTree(root: TreeNode): TreeNode[] {
    const result: TreeNode[] = [];

    function walk(node: TreeNode) {
        // Don't include root itself
        if (node.id !== '') {
            result.push(node);
        }
        for (const child of node.children) {
            walk(child);
        }
    }

    for (const child of root.children) {
        walk(child);
    }

    return result;
}

function getNodeState(node: TreeNode, selected: Set<number>): 'all' | 'none' | 'partial' {
    const total = node.leafIndices.length;
    if (total === 0) return 'none';
    let count = 0;
    for (const idx of node.leafIndices) {
        if (selected.has(idx)) count++;
    }
    if (count === 0) return 'none';
    if (count === total) return 'all';
    return 'partial';
}

// --- Changeset-style Interactive Tree Selector ---
async function interactiveTreeSelect<T>(
    items: T[],
    options: {
        title: string;
        subtitle: string;
        buildTree: (items: T[]) => TreeNode;
        formatNode: (node: TreeNode, state: 'all' | 'none' | 'partial', isCursor: boolean) => string;
        defaultAll: boolean;
    }
): Promise<number[] | null> {
    const { title, subtitle, buildTree, formatNode, defaultAll } = options;

    const root = buildTree(items);
    const flatNodes = flattenTree(root);

    if (flatNodes.length === 0) return null;

    const selected = new Set<number>();
    if (defaultAll) {
        for (let i = 0; i < items.length; i++) selected.add(i);
    }

    let cursor = 0;

    // Setup raw mode
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY || !stdout.isTTY) {
        // Non-interactive fallback: select all
        return defaultAll ? Array.from(selected) : null;
    }

    const wasRaw = Boolean((stdin as any).isRaw);
    stdin.setRawMode(true);
    stdin.resume();
    readline.emitKeypressEvents(stdin);

    function render() {
        // Clear previous render
        stdout.write('\x1B[?25l'); // Hide cursor

        // Move up and clear if not first render
        const totalLines = flatNodes.length + 4;
        stdout.write(`\x1B[${totalLines}A`);

        stdout.write('\x1B[0J'); // Clear from cursor to end of screen

        stdout.write(`\n${chalk.bold.cyan(title)}\n`);
        stdout.write(`${chalk.dim(subtitle)}\n\n`);

        for (let i = 0; i < flatNodes.length; i++) {
            const node = flatNodes[i]!;
            const state = getNodeState(node, selected);
            const isCursor = i === cursor;
            stdout.write(formatNode(node, state, isCursor) + '\n');
        }

        stdout.write('\n');
    }

    function initialRender() {
        stdout.write(`\n${chalk.bold.cyan(title)}\n`);
        stdout.write(`${chalk.dim(subtitle)}\n\n`);

        for (let i = 0; i < flatNodes.length; i++) {
            const node = flatNodes[i]!;
            const state = getNodeState(node, selected);
            const isCursor = i === cursor;
            stdout.write(formatNode(node, state, isCursor) + '\n');
        }

        stdout.write('\n');
    }

    initialRender();

    return new Promise<number[] | null>((resolve) => {
        function cleanup() {
            stdin.setRawMode(wasRaw);
            stdin.pause();
            stdin.removeListener('keypress', onKeypress);
            stdout.write('\x1B[?25h'); // Show cursor
        }

        function onKeypress(_str: string | undefined, key: readline.Key) {
            if (key.ctrl && key.name === 'c') {
                cleanup();
                resolve(null);
                return;
            }

            if (key.name === 'return' || key.name === 'enter') {
                cleanup();
                const result = Array.from(selected);
                if (result.length === 0) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                return;
            }

            if (key.name === 'up') {
                cursor = (cursor - 1 + flatNodes.length) % flatNodes.length;
                render();
                return;
            }

            if (key.name === 'down') {
                cursor = (cursor + 1) % flatNodes.length;
                render();
                return;
            }

            if (key.name === 'space') {
                // Toggle current node (and all its children)
                const node = flatNodes[cursor]!;
                const state = getNodeState(node, selected);

                if (state === 'all') {
                    // Deselect all leaves under this node
                    for (const idx of node.leafIndices) {
                        selected.delete(idx);
                    }
                } else {
                    // Select all leaves under this node
                    for (const idx of node.leafIndices) {
                        selected.add(idx);
                    }
                }
                render();
                return;
            }

            // 'a' for select all
            if (key.name === 'a') {
                const allSelected = selected.size === items.length;
                if (allSelected) {
                    selected.clear();
                } else {
                    for (let i = 0; i < items.length; i++) selected.add(i);
                }
                render();
                return;
            }
        }

        stdin.on('keypress', onKeypress);
    });
}

// --- Skill Selection ---
export async function promptSkillsInteractive(
    skills: SkillChoice[],
    options: { defaultAll?: boolean } = {}
): Promise<SkillChoice[] | null> {
    if (skills.length === 0) return null;

    const selectedIndices = await interactiveTreeSelect(skills, {
        title: 'Select skills to install',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: buildSkillTree,
        formatNode: (node, state, isCursor) => {
            const indent = '  '.repeat(node.depth - 1);
            const checkbox = state === 'all' ? chalk.green('●')
                : state === 'partial' ? chalk.yellow('◐')
                    : chalk.dim('○');
            const name = isCursor
                ? chalk.cyan.underline(node.name)
                : node.name;
            const cursor = isCursor ? chalk.cyan('› ') : '  ';
            const count = node.leafIndices.length > 1 ? chalk.dim(` (${node.leafIndices.length})`) : '';

            // Show action hint when cursor is on this row
            let hint = '';
            if (isCursor && node.leafIndices.length > 0) {
                hint = state === 'all'
                    ? chalk.dim(' ← Space to deselect')
                    : chalk.dim(' ← Space to select');
            }

            return `${cursor}${indent}${checkbox} ${name}${count}${hint}`;
        },
        defaultAll: options.defaultAll !== false,
    });

    if (!selectedIndices || selectedIndices.length === 0) {
        return null;
    }

    console.log(chalk.green(`\n✓ ${selectedIndices.length} skill${selectedIndices.length > 1 ? 's' : ''} selected\n`));
    return selectedIndices.map(i => skills[i]!);
}

// --- Platform Selection (simpler, flat list) ---
export async function promptPlatformsInteractive(
    options: { defaultAll?: boolean } = {}
): Promise<Platform[] | null> {
    // For platforms, use a simple flat tree
    const platformItems = PLATFORMS.map(p => ({ platform: p }));

    const selectedIndices = await interactiveTreeSelect(platformItems, {
        title: 'Select target platforms',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: (items) => {
            // Create "All Platforms" as a parent node
            const allNode: TreeNode = {
                id: 'all',
                name: 'All Platforms',
                depth: 1,
                children: [],
                leafIndices: [],
                isLeaf: false
            };

            for (let i = 0; i < items.length; i++) {
                const p = items[i]!.platform;
                allNode.children.push({
                    id: p,
                    name: p,
                    depth: 2,
                    children: [],
                    leafIndices: [i],
                    isLeaf: true,
                });
                allNode.leafIndices.push(i);
            }

            const root: TreeNode = { id: '', name: '.', depth: 0, children: [allNode], leafIndices: allNode.leafIndices.slice(), isLeaf: false };
            return root;
        },
        formatNode: (node, state, isCursor) => {
            const indent = '  '.repeat(node.depth - 1);
            const checkbox = state === 'all' ? chalk.green('●')
                : state === 'partial' ? chalk.yellow('◐')
                    : chalk.dim('○');

            let displayName = node.name;
            if (node.name !== 'All Platforms') {
                const platform = node.name as Platform;
                const display = PLATFORM_DISPLAY[platform];
                if (display) displayName = display.name;
            }

            const name = isCursor ? chalk.cyan.underline(displayName) : displayName;
            const cursor = isCursor ? chalk.cyan('› ') : '  ';
            const count = node.leafIndices.length > 1 ? chalk.dim(` (${node.leafIndices.length})`) : '';

            // Show action hint when cursor is on this row
            let hint = '';
            if (isCursor && node.leafIndices.length > 0) {
                hint = state === 'all'
                    ? chalk.dim(' ← Space to deselect')
                    : chalk.dim(' ← Space to select');
            }

            return `${cursor}${indent}${checkbox} ${name}${count}${hint}`;
        },
        defaultAll: options.defaultAll !== false,
    });

    if (!selectedIndices || selectedIndices.length === 0) {
        return null;
    }

    const selected = selectedIndices.map(i => PLATFORMS[i]!);
    console.log(chalk.green(`\n✓ Installing to ${selected.length} platform${selected.length > 1 ? 's' : ''}\n`));
    return selected;
}
