import chalk from 'chalk';
import type { Platform } from '@skild/core';
import { PLATFORMS } from '@skild/core';
import {
  enqueuePostPromptLog,
  formatInteractiveRow,
  interactiveTreeSelect,
  type SelectionInfo,
  type TreeNode
} from '../ui/interactive-tree-prompt.js';

export { enqueuePostPromptLog, flushInteractiveUiNow } from '../ui/interactive-tree-prompt.js';

// ============================================================================
// Types (public)
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

// ============================================================================
// Tree building helpers
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

function createTreeNode(
  id: string,
  name: string,
  depth: number,
  isLeaf: boolean,
  leafIndices: number[] = []
): TreeNode {
  return { id, name, depth, children: [], leafIndices, isLeaf };
}

function wrapWithRoot(allNode: TreeNode): TreeNode {
  return {
    id: '',
    name: '.',
    depth: 0,
    children: [allNode],
    leafIndices: [...allNode.leafIndices],
    isLeaf: false
  };
}

function adjustDepth(node: TreeNode, delta: number): void {
  node.depth += delta;
  for (const child of node.children) adjustDepth(child, delta);
}

function collapseIntermediateNodes(allNode: TreeNode): void {
  while (
    allNode.children.length === 1 &&
    !allNode.children[0]!.isLeaf &&
    allNode.children[0]!.children.length > 0
  ) {
    const singleChild = allNode.children[0]!;
    for (const grandchild of singleChild.children) adjustDepth(grandchild, -1);
    allNode.children = singleChild.children;
  }
}

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

  collapseIntermediateNodes(allNode);
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

function buildPlatformTree(items: { platform: Platform }[]): TreeNode {
  const allNode = createTreeNode('all', 'All Platforms', 1, false);

  for (let i = 0; i < items.length; i++) {
    const platform = items[i]!.platform;
    allNode.children.push(createTreeNode(platform, platform, 2, true, [i]));
    allNode.leafIndices.push(i);
  }

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

// ============================================================================
// Rendering helpers
// ============================================================================

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
  return description ? ` - ${description}` : '';
}

function getPlatformDisplay(platform: Platform): string {
  return PLATFORM_DISPLAY[platform] || platform;
}

function buildSpaceHint(node: TreeNode, selection: SelectionInfo): string {
  const totalCount = node.leafIndices.length;
  if (totalCount <= 0) return '';

  const isLeaf = Boolean(node.isLeaf && node.leafIndices.length === 1);

  if (selection.state === 'all') {
    return isLeaf ? ' (Space: unselect)' : ' (Space: unselect all)';
  }

  return isLeaf ? ' (Space: select)' : ' (Space: select all)';
}

function formatTreeNode(
  node: TreeNode,
  selection: SelectionInfo,
  isCursor: boolean,
  maxWidth: number,
  options: { suffixText?: string; hintText?: string } = {}
): string {
  const { state, selectedCount } = selection;
  const totalCount = node.leafIndices.length;

  const indent = '  '.repeat(Math.max(0, node.depth - 1));
  const glyph =
    state === 'all' ? chalk.green('●') : state === 'partial' ? chalk.yellow('◐') : chalk.dim('○');
  const cursorMark = isCursor ? chalk.cyan('› ') : '  ';
  const count = totalCount > 1 ? chalk.dim(` (${selectedCount}/${totalCount})`) : '';

  return formatInteractiveRow({
    cursorMark,
    indent,
    glyph,
    name: node.name || '',
    count,
    suffixText: options.suffixText || '',
    hintText: isCursor ? (options.hintText || '') : '',
    isCursor,
    maxWidth,
    styleName: s => chalk.cyan.underline(s),
  });
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
  const defaultSelected = new Set<number>();

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i]!;
    const installedOnTargets = skill.installedPlatforms?.filter(p => targetPlatforms.includes(p)) || [];
    const isFullyInstalled = hasInstalledCheck && installedOnTargets.length === targetPlatforms.length;
    if (options.defaultAll !== false && !isFullyInstalled) defaultSelected.add(i);
  }

  const selectedIndices = await interactiveTreeSelect(skills, {
    title: 'Select skills to install',
    subtitle: '↑↓ navigate • Space toggle • Enter confirm',
    buildTree: buildSkillTree,
    formatNode: (node, selection, isCursor, maxWidth) => {
      let installedSuffixText = '';

      if (node.isLeaf && node.leafIndices.length === 1) {
        const skill = skills[node.leafIndices[0]!];
        if (skill?.installedPlatforms?.length) {
          if (skill.installedPlatforms.length === targetPlatforms.length && targetPlatforms.length > 0) {
            installedSuffixText = ' [installed]';
          } else if (skill.installedPlatforms.length > 0) {
            installedSuffixText = ` [installed on ${skill.installedPlatforms.length}]`;
          }
        }
      }

      const descriptionSuffix = getSkillDescriptionSuffix(skills, node, isCursor);
      return formatTreeNode(node, selection, isCursor, maxWidth, {
        suffixText: `${installedSuffixText}${descriptionSuffix}`,
        hintText: buildSpaceHint(node, selection),
      });
    },
    defaultAll: false,
    defaultSelected,
  });

  if (!selectedIndices) return null;

  const selectedSkills = selectedIndices.map(i => skills[i]!);
  const names = selectedSkills.map(s => (s.relPath === '.' ? s.suggestedSource : s.relPath));
  enqueuePostPromptLog(
    chalk.green(
      `\n✓ Selected ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`
    )
  );
  return selectedSkills;
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
    formatNode: (node, selection, isCursor, maxWidth) => {
      const descriptionSuffix = getSkillDescriptionSuffix(skills, node, isCursor);
      return formatTreeNode(node, selection, isCursor, maxWidth, {
        suffixText: descriptionSuffix,
        hintText: buildSpaceHint(node, selection),
      });
    },
    defaultAll: options.defaultAll !== false,
  });

  if (!selectedIndices) return null;

  const selectedSkills = selectedIndices.map(i => skills[i]!);
  const names = selectedSkills.map(s => s.displayName || s.relPath || s.suggestedSource);
  enqueuePostPromptLog(
    chalk.green(
      `\n✓ Selected ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`
    )
  );
  return selectedSkills;
}

export async function promptPlatformsInteractive(
  options: { defaultAll?: boolean; platforms?: Platform[]; installedPlatforms?: Platform[] } = {}
): Promise<Platform[] | null> {
  const platforms = options.platforms && options.platforms.length > 0 ? options.platforms : PLATFORMS;
  const platformItems = platforms.map(p => ({ platform: p }));
  const installedSet = new Set(options.installedPlatforms ?? []);
  const defaultSelected = installedSet.size > 0
    ? new Set(platforms.flatMap((p, idx) => (installedSet.has(p) ? [idx] : [])))
    : undefined;

  const selectedIndices = await interactiveTreeSelect(platformItems, {
    title: 'Select target platforms',
    subtitle: '↑↓ navigate • Space toggle • Enter confirm',
    buildTree: buildPlatformTree,
    formatNode: (node, selection, isCursor, maxWidth) => {
      const displayName =
        node.name === 'All Platforms' ? node.name : PLATFORM_DISPLAY[node.name as Platform] || node.name;
      const installedSuffix =
        node.name !== 'All Platforms' && installedSet.has(node.name as Platform) ? ' [installed]' : '';
      return formatTreeNode({ ...node, name: displayName }, selection, isCursor, maxWidth, {
        suffixText: installedSuffix,
        hintText: buildSpaceHint(node, selection),
      });
    },
    defaultAll: options.defaultAll !== false,
    defaultSelected,
  });

  if (!selectedIndices) return null;

  const selected = selectedIndices.map(i => platforms[i]!);
  const names = selected.map(p => PLATFORM_DISPLAY[p] || p);
  enqueuePostPromptLog(
    chalk.green(
      `\n✓ Installing to ${selected.length} platform${selected.length > 1 ? 's' : ''}: ${chalk.cyan(names.join(', '))}\n`
    )
  );
  return selected;
}

export async function promptSyncTargetsInteractive(
  choices: SyncTargetChoice[]
): Promise<SyncTargetChoice[] | null> {
  if (choices.length === 0) return null;

  const selectedIndices = await interactiveTreeSelect(choices, {
    title: 'Select sync targets',
    subtitle: '↑↓ navigate • Space toggle • Enter confirm',
    buildTree: buildSyncTree,
    formatNode: (node, selection, isCursor, maxWidth) => {
      if (!node.isLeaf && node.depth === 2) {
        const display = getPlatformDisplay(node.name as Platform);
        return formatTreeNode({ ...node, name: display }, selection, isCursor, maxWidth, {
          hintText: buildSpaceHint(node, selection),
        });
      }

      if (node.isLeaf && node.leafIndices.length === 1) {
        const choice = choices[node.leafIndices[0]!]!;
        const platformLabel = getPlatformDisplay(choice.sourcePlatform);
        const suffixText = ` [from ${platformLabel} · ${choice.sourceTypeLabel}]`;
        return formatTreeNode(node, selection, isCursor, maxWidth, {
          suffixText,
          hintText: buildSpaceHint(node, selection),
        });
      }

      return formatTreeNode(node, selection, isCursor, maxWidth, {
        hintText: buildSpaceHint(node, selection),
      });
    },
    defaultAll: true,
  });

  if (!selectedIndices) return null;

  const selected = selectedIndices.map(i => choices[i]!);
  const summary = selected.map(c => `${c.displayName}→${getPlatformDisplay(c.targetPlatform)}`).join(', ');
  enqueuePostPromptLog(chalk.green(`\n✓ Syncing ${selected.length} target(s): ${chalk.cyan(summary)}\n`));
  return selected;
}
