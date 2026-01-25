import chalk from 'chalk';
import { listSkills, PLATFORMS, type InstallScope, type Platform } from '@skild/core';
import { flushInteractiveUiNow, promptPlatformsInteractive, promptScopesInteractive } from './interactive-select.js';

export interface TargetSelectionOptions {
  target?: Platform | string;
  local?: boolean;
  global?: boolean;
  json?: boolean;
}

export interface TargetSelection {
  platforms: Platform[];
  scopes: InstallScope[];
}

const ALL_SCOPES: InstallScope[] = ['global', 'project'];

export function formatTargetLabel(platform: Platform, scope: InstallScope): string {
  return `${platform} (${scope})`;
}

export function formatTargetSummary(platforms: Platform[], scopes: InstallScope[]): string {
  const platformLabel = platforms.length === PLATFORMS.length
    ? 'all platforms'
    : platforms.length === 1
      ? platforms[0]
      : `${platforms.length} platforms`;

  const scopeLabel = scopes.length === ALL_SCOPES.length
    ? 'all scopes'
    : scopes.length === 1
      ? scopes[0]
      : `${scopes.length} scopes`;

  return `${platformLabel}, ${scopeLabel}`;
}

function resolveScopeSelection(options: TargetSelectionOptions, interactive: boolean): {
  scopes: InstallScope[];
  needsPrompt: boolean;
} {
  const wantsLocal = Boolean(options.local);
  const wantsGlobal = Boolean(options.global);

  if (wantsLocal && wantsGlobal) return { scopes: [...ALL_SCOPES], needsPrompt: false };
  if (wantsLocal) return { scopes: ['project'], needsPrompt: false };
  if (wantsGlobal) return { scopes: ['global'], needsPrompt: false };

  if (!interactive) return { scopes: ['global'], needsPrompt: false };

  return { scopes: [...ALL_SCOPES], needsPrompt: true };
}

function resolvePlatformSelection(options: TargetSelectionOptions, interactive: boolean): {
  platforms: Platform[];
  needsPrompt: boolean;
} {
  if (options.target) return { platforms: [options.target as Platform], needsPrompt: false };
  if (!interactive) return { platforms: ['claude'], needsPrompt: false };
  return { platforms: [...PLATFORMS], needsPrompt: true };
}

function listInstalledPlatforms(scopes: InstallScope[]): Platform[] {
  const installed: Platform[] = [];
  for (const platform of PLATFORMS) {
    for (const scope of scopes) {
      if (listSkills({ platform, scope }).length > 0) {
        installed.push(platform);
        break;
      }
    }
  }
  return installed;
}

export async function resolveTargetSelection(
  options: TargetSelectionOptions,
  interactive: boolean
): Promise<TargetSelection | null> {
  const scopeSelection = resolveScopeSelection(options, interactive);
  let scopes = scopeSelection.scopes;

  if (scopeSelection.needsPrompt) {
    const selectedScopes = await promptScopesInteractive({ defaultAll: true });
    if (!selectedScopes) {
      console.log(chalk.red('No scopes selected.'));
      process.exitCode = 1;
      return null;
    }
    scopes = selectedScopes;
    flushInteractiveUiNow();
  }

  const platformSelection = resolvePlatformSelection(options, interactive);
  let platforms = platformSelection.platforms;

  if (platformSelection.needsPrompt) {
    const installedPlatforms = listInstalledPlatforms(scopes);
    const selectedPlatforms = await promptPlatformsInteractive({
      defaultAll: true,
      platforms: [...PLATFORMS],
      installedPlatforms,
    });
    if (!selectedPlatforms) {
      console.log(chalk.red('No platforms selected.'));
      process.exitCode = 1;
      return null;
    }
    platforms = selectedPlatforms;
    flushInteractiveUiNow();
  }

  return { platforms, scopes };
}
