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
    /** Platforms where this skill is already installed */
    installedPlatforms?: Platform[];
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

    // Collapse single-child intermediate nodes: if All Skills has only one child
    // and that child is not a leaf, promote its children directly under All Skills
    while (allNode.children.length === 1 && !allNode.children[0]!.isLeaf && allNode.children[0]!.children.length > 0) {
        const singleChild = allNode.children[0]!;
        // Promote children, adjusting their depth
        for (const grandchild of singleChild.children) {
            adjustDepth(grandchild, -1);
        }
        allNode.children = singleChild.children;
    }

    const root: TreeNode = { id: '', name: '.', depth: 0, children: [allNode], leafIndices: allNode.leafIndices.slice(), isLeaf: false };
    return root;
}

function adjustDepth(node: TreeNode, delta: number): void {
    node.depth += delta;
    for (const child of node.children) {
        adjustDepth(child, delta);
    }
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
        /** Custom initial selection (overrides defaultAll if provided) */
        defaultSelected?: Set<number>;
    }
): Promise<number[] | null> {
    const { title, subtitle, buildTree, formatNode, defaultAll, defaultSelected } = options;

    const root = buildTree(items);
    const flatNodes = flattenTree(root);

    if (flatNodes.length === 0) return null;

    const selected = new Set<number>();
    if (defaultSelected) {
        for (const idx of defaultSelected) selected.add(idx);
    } else if (defaultAll) {
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
    options: { defaultAll?: boolean; targetPlatforms?: Platform[] } = {}
): Promise<SkillChoice[] | null> {
    if (skills.length === 0) return null;

    // Determine which skills are already installed on target platforms
    const targetPlatforms = options.targetPlatforms || [];
    const hasInstalledCheck = targetPlatforms.length > 0;

    // Calculate default selection: skip already-installed if we have platform info
    const defaultSelected = new Set<number>();
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i]!;
        const installedOnTargets = skill.installedPlatforms?.filter(p => targetPlatforms.includes(p)) || [];
        const isFullyInstalled = hasInstalledCheck && installedOnTargets.length === targetPlatforms.length;

        // By default: don't select fully-installed skills, select others
        if (options.defaultAll !== false && !isFullyInstalled) {
            defaultSelected.add(i);
        }
    }

    const selectedIndices = await interactiveTreeSelect(skills, {
        title: 'Select skills to install',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: buildSkillTree,
        formatNode: (node, state, isCursor) => {
            const indent = '  '.repeat(node.depth - 1);
            const checkbox = state === 'all' ? chalk.green('●')
                : state === 'partial' ? chalk.yellow('◐')
                    : chalk.dim('○');

            // Check if this is a leaf node representing a single skill
            let installedTag = '';
            if (node.isLeaf && node.leafIndices.length === 1) {
                const skill = skills[node.leafIndices[0]!];
                if (skill?.installedPlatforms?.length) {
                    if (skill.installedPlatforms.length === targetPlatforms.length && targetPlatforms.length > 0) {
                        installedTag = chalk.dim(' [installed]');
                    } else if (skill.installedPlatforms.length > 0) {
                        installedTag = chalk.dim(` [installed on ${skill.installedPlatforms.length}]`);
                    }
                }
            }

            const name = isCursor
                ? chalk.cyan.underline(node.name)
                : node.name;
            const cursor = isCursor ? chalk.cyan('› ') : '  ';
            const count = node.leafIndices.length > 1 ? chalk.dim(` (${node.leafIndices.length})`) : '';

            // Show action hint when cursor is on this row
            let hint = '';
            if (isCursor && node.leafIndices.length > 0) {
                if (installedTag && state !== 'all') {
                    hint = chalk.dim(' ← Space to reinstall');
                } else {
                    hint = state === 'all'
                        ? chalk.dim(' ← Space to deselect')
                        : chalk.dim(' ← Space to select');
                }
            }

            return `${cursor}${indent}${checkbox} ${name}${count}${installedTag}${hint}`;
        },
        defaultAll: false, // We handle default selection manually
        defaultSelected,
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
