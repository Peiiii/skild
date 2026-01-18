/**
 * Interactive tree-based selection UI (changeset-style).
 * 
 * Features:
 * - Tree structure with collapsible parent nodes
 * - Space to toggle selection (parent toggles all children)
 * - Arrow keys for navigation
 * - Visual hints for actions
 */
import readline from 'readline';
import chalk from 'chalk';
import type { Platform } from '@skild/core';
import { PLATFORMS } from '@skild/core';

// ============================================================================
// Types
// ============================================================================

export type SkillChoice = {
    relPath: string;
    suggestedSource: string;
    materializedDir?: string;
    installedPlatforms?: Platform[];
    displayName?: string;
    description?: string;
};

export type SkillTreeNode = {
    id: string;
    label: string;
    children?: SkillTreeNode[];
    skillIndex?: number;
};

export type SyncTargetChoice = {
    skill: string;
    displayName: string;
    targetPlatform: Platform;
    sourcePlatform: Platform;
    sourceTypeLabel: string;
};

type TreeNode = {
    id: string;
    name: string;
    depth: number;
    children: TreeNode[];
    leafIndices: number[];
    isLeaf: boolean;
};

type SelectionState = 'all' | 'none' | 'partial';

interface TreeSelectOptions<T> {
    title: string;
    subtitle: string;
    buildTree: (items: T[]) => TreeNode;
    formatNode: (node: TreeNode, selection: SelectionInfo, isCursor: boolean) => string;
    defaultAll: boolean;
    defaultSelected?: Set<number>;
}

// ============================================================================
// Tree Building
// ============================================================================

function buildSkillTree(skills: SkillChoice[]): TreeNode {
    const allNode = createTreeNode('all', 'All Skills', 1, false);

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
                child = createTreeNode(nodeId, part, d + 2, d === parts.length - 1);
                current.children.push(child);
            }
            child.leafIndices.push(i);
            current = child;
        }
    }

    // Collapse single-child intermediate nodes
    collapseIntermediateNodes(allNode);

    return wrapWithRoot(allNode);
}

function buildSyncTree(choices: SyncTargetChoice[]): TreeNode {
    const root = createTreeNode('root', 'All targets', 1, false);

    const platforms = new Map<Platform, TreeNode>();

    for (let i = 0; i < choices.length; i++) {
        const choice = choices[i]!;
        let platformNode = platforms.get(choice.targetPlatform);
        if (!platformNode) {
            platformNode = createTreeNode(choice.targetPlatform, choice.targetPlatform, 2, false);
            platforms.set(choice.targetPlatform, platformNode);
            root.children.push(platformNode);
        }

        const skillNode = createTreeNode(
            `${choice.targetPlatform}:${choice.skill}`,
            choice.displayName,
            3,
            true,
            [i]
        );

        platformNode.children.push(skillNode);
        platformNode.leafIndices.push(i);
        root.leafIndices.push(i);
    }

    return wrapWithRoot(root);
}

function buildPlatformTree(items: { platform: Platform }[]): TreeNode {
    const allNode = createTreeNode('all', 'All Platforms', 1, false);

    for (let i = 0; i < items.length; i++) {
        const platform = items[i]!.platform;
        allNode.children.push(createTreeNode(platform, platform, 2, true, [i]));
        allNode.leafIndices.push(i);
    }

    return wrapWithRoot(allNode);
}

function buildTreeFromSkillNodes(nodes: SkillTreeNode[], totalSkills: number): TreeNode {
    const allNode = createTreeNode('all', 'All Skills', 1, false);

    const attach = (node: SkillTreeNode, depth: number): TreeNode => {
        const treeNode = createTreeNode(
            node.id,
            node.label,
            depth,
            Boolean(node.skillIndex != null && (!node.children || node.children.length === 0)),
            node.skillIndex != null ? [node.skillIndex] : []
        );
        if (node.children?.length) {
            for (const child of node.children) {
                const childNode = attach(child, depth + 1);
                treeNode.children.push(childNode);
                treeNode.leafIndices.push(...childNode.leafIndices);
            }
        }
        return treeNode;
    };

    for (const node of nodes) {
        const childNode = attach(node, 2);
        allNode.children.push(childNode);
        allNode.leafIndices.push(...childNode.leafIndices);
    }

    if (allNode.leafIndices.length === 0 && totalSkills > 0) {
        for (let i = 0; i < totalSkills; i++) allNode.leafIndices.push(i);
    }

    return wrapWithRoot(allNode);
}

function createTreeNode(id: string, name: string, depth: number, isLeaf: boolean, leafIndices: number[] = []): TreeNode {
    return { id, name, depth, children: [], leafIndices, isLeaf };
}

function wrapWithRoot(allNode: TreeNode): TreeNode {
    return { id: '', name: '.', depth: 0, children: [allNode], leafIndices: [...allNode.leafIndices], isLeaf: false };
}

function collapseIntermediateNodes(allNode: TreeNode): void {
    while (allNode.children.length === 1 && !allNode.children[0]!.isLeaf && allNode.children[0]!.children.length > 0) {
        const singleChild = allNode.children[0]!;
        for (const grandchild of singleChild.children) {
            adjustDepth(grandchild, -1);
        }
        allNode.children = singleChild.children;
    }
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
        if (node.id !== '') result.push(node);
        for (const child of node.children) walk(child);
    }

    for (const child of root.children) walk(child);
    return result;
}

interface SelectionInfo {
    state: SelectionState;
    selectedCount: number;
}

function getNodeSelection(node: TreeNode, selected: Set<number>): SelectionInfo {
    const total = node.leafIndices.length;
    if (total === 0) return { state: 'none', selectedCount: 0 };

    let selectedCount = 0;
    for (const idx of node.leafIndices) {
        if (selected.has(idx)) selectedCount++;
    }

    let state: SelectionState = 'none';
    if (selectedCount === total) state = 'all';
    else if (selectedCount > 0) state = 'partial';

    return { state, selectedCount };
}

// ============================================================================
// Terminal Rendering
// ============================================================================

interface TerminalRenderer {
    renderContent: () => string[];
    getLineCount: () => number;
}

function createRenderer(
    title: string,
    subtitle: string,
    flatNodes: TreeNode[],
    selected: Set<number>,
    getCursor: () => number,
    formatNode: (node: TreeNode, selection: SelectionInfo, isCursor: boolean) => string
): TerminalRenderer {
    function renderContent(): string[] {
        const lines: string[] = [];
        lines.push(chalk.bold.cyan(title));
        lines.push(chalk.dim(subtitle));
        lines.push(''); // blank line

        const cursor = getCursor();
        for (let i = 0; i < flatNodes.length; i++) {
            const node = flatNodes[i]!;
            const selection = getNodeSelection(node, selected);
            lines.push(formatNode(node, selection, i === cursor));
        }

        lines.push(''); // trailing blank
        return lines;
    }

    function getLineCount(): number {
        // title + subtitle + blank + nodes + blank
        return 4 + flatNodes.length;
    }

    return { renderContent, getLineCount };
}

function writeToTerminal(stdout: NodeJS.WriteStream, lines: string[]): void {
    for (const line of lines) {
        stdout.write(line + '\n');
    }
}

function clearAndRerender(stdout: NodeJS.WriteStream, lineCount: number, lines: string[]): void {
    stdout.write('\x1B[?25l'); // Hide cursor
    stdout.write(`\x1B[${lineCount}A`); // Move up
    stdout.write('\x1B[0J'); // Clear to end
    writeToTerminal(stdout, lines);
}

// ============================================================================
// Interactive Selection Core
// ============================================================================

async function interactiveTreeSelect<T>(
    items: T[],
    options: TreeSelectOptions<T>
): Promise<number[] | null> {
    const { title, subtitle, buildTree, formatNode, defaultAll, defaultSelected } = options;

    const root = buildTree(items);
    const flatNodes = flattenTree(root);
    if (flatNodes.length === 0) return null;

    // Initialize selection
    const selected = new Set<number>();
    if (defaultSelected) {
        for (const idx of defaultSelected) selected.add(idx);
    } else if (defaultAll) {
        for (let i = 0; i < items.length; i++) selected.add(i);
    }

    let cursor = 0;
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Non-interactive fallback
    if (!stdin.isTTY || !stdout.isTTY) {
        return defaultAll ? Array.from(selected) : null;
    }

    // Setup raw mode
    const wasRaw = Boolean((stdin as any).isRaw);
    stdin.setRawMode(true);
    stdin.resume();
    readline.emitKeypressEvents(stdin);

    // Create renderer
    const renderer = createRenderer(title, subtitle, flatNodes, selected, () => cursor, formatNode);

    // Initial render
    writeToTerminal(stdout, renderer.renderContent());

    return new Promise<number[] | null>((resolve) => {
        function cleanup(clear = false) {
            if (clear) {
                const lineCount = renderer.getLineCount();
                stdout.write(`\x1B[${lineCount}A`); // Move up
                stdout.write('\x1B[0J'); // Clear to end
            }
            stdin.setRawMode(wasRaw);
            stdin.pause();
            stdin.removeListener('keypress', onKeypress);
            stdout.write('\x1B[?25h'); // Show cursor
        }

        function rerender() {
            clearAndRerender(stdout, renderer.getLineCount(), renderer.renderContent());
        }

        function toggleNode(node: TreeNode) {
            const { state } = getNodeSelection(node, selected);
            if (state === 'all') {
                for (const idx of node.leafIndices) selected.delete(idx);
            } else {
                for (const idx of node.leafIndices) selected.add(idx);
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
                cleanup(true); // Clear on exit
                resolve(null);
                return;
            }

            if (key.name === 'return' || key.name === 'enter') {
                cleanup(true); // Clear on confirm
                resolve(selected.size > 0 ? Array.from(selected) : null);
                return;
            }

            if (key.name === 'up') {
                cursor = (cursor - 1 + flatNodes.length) % flatNodes.length;
                rerender();
                return;
            }

            if (key.name === 'down') {
                cursor = (cursor + 1) % flatNodes.length;
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

// ============================================================================
// Node Formatters
// ============================================================================

const PLATFORM_DISPLAY: Record<Platform, string> = {
    claude: 'Claude',
    codex: 'Codex',
    copilot: 'Copilot',
    antigravity: 'Antigravity',
    opencode: 'OpenCode',
    cursor: 'Cursor',
    windsurf: 'Windsurf',
};

function formatTreeNode(
    node: TreeNode,
    selection: SelectionInfo,
    isCursor: boolean,
    options: { suffix?: string } = {}
): string {
    const { state, selectedCount } = selection;
    const totalCount = node.leafIndices.length;

    const indent = '  '.repeat(node.depth - 1);
    const checkbox = state === 'all' ? chalk.green('●')
        : state === 'partial' ? chalk.yellow('◐')
            : chalk.dim('○');
    const name = isCursor ? chalk.cyan.underline(node.name) : node.name;
    const cursorMark = isCursor ? chalk.cyan('› ') : '  ';

    // Formatted count: e.g. (16/16) or (1/16)
    let count = '';
    if (totalCount > 1) {
        count = chalk.dim(` (${selectedCount}/${totalCount})`);
    }

    const suffix = options.suffix || '';

    // Action hint
    let hint = '';
    if (isCursor && totalCount > 0) {
        hint = state === 'all'
            ? chalk.dim(' ← Space to deselect')
            : chalk.dim(' ← Space to select');
    }

    return `${cursorMark}${indent}${checkbox} ${name}${count}${suffix}${hint}`;
}

function truncateDescription(value: string, maxLen: number): string {
    const trimmed = value.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return `${trimmed.slice(0, maxLen - 3).trimEnd()}...`;
}

function getSkillDescriptionSuffix(skills: SkillChoice[], node: TreeNode, isCursor: boolean): string {
    if (!isCursor || !node.isLeaf || node.leafIndices.length !== 1) return '';
    const skill = skills[node.leafIndices[0]!];
    if (!skill?.description) return '';
    const description = truncateDescription(skill.description, 72);
    if (!description) return '';
    return chalk.dim(` - ${description}`);
}

function getPlatformDisplay(platform: Platform): string {
    return PLATFORM_DISPLAY[platform] || platform;
}

// ============================================================================
// Public API
// ============================================================================

export async function promptSkillsInteractive(
    skills: SkillChoice[],
    options: { defaultAll?: boolean; targetPlatforms?: Platform[] } = {}
): Promise<SkillChoice[] | null> {
    if (skills.length === 0) return null;

    const targetPlatforms = options.targetPlatforms || [];
    const hasInstalledCheck = targetPlatforms.length > 0;

    // Calculate default selection
    const defaultSelected = new Set<number>();
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i]!;
        const installedOnTargets = skill.installedPlatforms?.filter(p => targetPlatforms.includes(p)) || [];
        const isFullyInstalled = hasInstalledCheck && installedOnTargets.length === targetPlatforms.length;

        if (options.defaultAll !== false && !isFullyInstalled) {
            defaultSelected.add(i);
        }
    }

    const selectedIndices = await interactiveTreeSelect(skills, {
        title: 'Select skills to install',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: buildSkillTree,
        formatNode: (node, selection, isCursor) => {
            // Check installed status for leaf nodes
            let installedSuffix = '';
            if (node.isLeaf && node.leafIndices.length === 1) {
                const skill = skills[node.leafIndices[0]!];
                if (skill?.installedPlatforms?.length) {
                    if (skill.installedPlatforms.length === targetPlatforms.length && targetPlatforms.length > 0) {
                        installedSuffix = chalk.dim(' [installed]');
                    } else if (skill.installedPlatforms.length > 0) {
                        installedSuffix = chalk.dim(` [installed on ${skill.installedPlatforms.length}]`);
                    }
                }
            }

            const descriptionSuffix = getSkillDescriptionSuffix(skills, node, isCursor);
            const formatted = formatTreeNode(node, selection, isCursor, { suffix: `${installedSuffix}${descriptionSuffix}` });

            // Override hint for installed items
            if (isCursor && installedSuffix && selection.state !== 'all') {
                return formatted.replace('← Space to select', '← Space to reinstall');
            }
            return formatted;
        },
        defaultAll: false,
        defaultSelected,
    });

    if (!selectedIndices) return null;

    const selectedSkills = selectedIndices.map(i => skills[i]!);
    const names = selectedSkills.map(s => s.relPath === '.' ? s.suggestedSource : s.relPath);
    console.log(chalk.green(`\n✓ Selected ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`));
    return selectedSkills;
}

export async function promptSyncTargetsInteractive(
    choices: SyncTargetChoice[]
): Promise<SyncTargetChoice[] | null> {
    if (choices.length === 0) return null;

    const selectedIndices = await interactiveTreeSelect(choices, {
        title: 'Select sync targets',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: buildSyncTree,
        formatNode: (node, selection, isCursor) => {
            // Platform node label
            if (!node.isLeaf && node.depth === 2) {
                const display = getPlatformDisplay(node.name as Platform);
                return formatTreeNode({ ...node, name: display }, selection, isCursor);
            }

            // Leaf node (skill)
            if (node.isLeaf && node.leafIndices.length === 1) {
                const choice = choices[node.leafIndices[0]!]!;
                const platformLabel = getPlatformDisplay(choice.sourcePlatform);
                const suffix = chalk.dim(` [from ${platformLabel} · ${choice.sourceTypeLabel}]`);
                return formatTreeNode(node, selection, isCursor, { suffix });
            }

            return formatTreeNode(node, selection, isCursor);
        },
        defaultAll: true,
    });

    if (!selectedIndices) return null;

    const selected = selectedIndices.map(i => choices[i]!);
    const summary = selected
        .map(c => `${c.displayName}→${getPlatformDisplay(c.targetPlatform)}`)
        .join(', ');
    console.log(chalk.green(`\n✓ Syncing ${selected.length} target(s): ${chalk.cyan(summary)}\n`));
    return selected;
}

export async function promptSkillsTreeInteractive(
    skills: SkillChoice[],
    tree: SkillTreeNode[],
    options: { defaultAll?: boolean } = {}
): Promise<SkillChoice[] | null> {
    const selectedIndices = await interactiveTreeSelect(skills, {
        title: 'Select skills from markdown',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: () => buildTreeFromSkillNodes(tree, skills.length),
        formatNode: (node, selection, isCursor) => {
            const descriptionSuffix = getSkillDescriptionSuffix(skills, node, isCursor);
            return formatTreeNode(node, selection, isCursor, { suffix: descriptionSuffix });
        },
        defaultAll: options.defaultAll !== false,
    });

    if (!selectedIndices) return null;

    const selectedSkills = selectedIndices.map(i => skills[i]!);
    const names = selectedSkills.map(s => s.displayName || s.relPath || s.suggestedSource);
    console.log(chalk.green(`\n✓ Selected ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`));
    return selectedSkills;
}

export async function promptPlatformsInteractive(
    options: { defaultAll?: boolean; platforms?: Platform[] } = {}
): Promise<Platform[] | null> {
    const platforms = options.platforms && options.platforms.length > 0 ? options.platforms : PLATFORMS;
    const platformItems = platforms.map(p => ({ platform: p }));

    const selectedIndices = await interactiveTreeSelect(platformItems, {
        title: 'Select target platforms',
        subtitle: '↑↓ navigate • Space toggle • Enter confirm',
        buildTree: buildPlatformTree,
        formatNode: (node, selection, isCursor) => {
            const displayName = node.name === 'All Platforms'
                ? node.name
                : PLATFORM_DISPLAY[node.name as Platform] || node.name;

            const modifiedNode = { ...node, name: displayName };
            return formatTreeNode(modifiedNode, selection, isCursor);
        },
        defaultAll: options.defaultAll !== false,
    });

    if (!selectedIndices) return null;

    const selected = selectedIndices.map(i => platforms[i]!);
    const names = selected.map(p => PLATFORM_DISPLAY[p] || p);
    console.log(chalk.green(`\n✓ Installing to ${selected.length} platform${selected.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`));
    return selected;
}
