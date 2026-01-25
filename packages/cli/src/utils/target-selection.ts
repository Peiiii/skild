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

function resolveScopeConstraint(options: TargetSelectionOptions): InstallScope[] {
  const wantsLocal = Boolean(options.local);
  const wantsGlobal = Boolean(options.global);

  if (wantsLocal && wantsGlobal) return [...ALL_SCOPES];
  if (wantsLocal) return ['project'];
  if (wantsGlobal) return ['global'];
  return [...ALL_SCOPES];
}

export function hasInstalledSkill(platform: Platform, scope: InstallScope, skillName?: string): boolean {
  const skills = listSkills({ platform, scope });
  if (!skillName) return skills.length > 0;
  return skills.some(s => s.name === skillName);
}

function listInstalledPlatforms(scopes: InstallScope[], skillName?: string): Platform[] {
  const installed: Platform[] = [];
  for (const platform of PLATFORMS) {
    for (const scope of scopes) {
      if (hasInstalledSkill(platform, scope, skillName)) {
        installed.push(platform);
        break;
      }
    }
  }
  return installed;
}

function listAvailableScopes(platforms: Platform[], skillName?: string): InstallScope[] {
  const scopes: InstallScope[] = [];
  for (const scope of ALL_SCOPES) {
    const hasAny = platforms.some(platform => hasInstalledSkill(platform, scope, skillName));
    if (hasAny) scopes.push(scope);
  }
  return scopes;
}

export async function resolveTargetSelection(
  options: TargetSelectionOptions,
  interactive: boolean,
  skillName?: string
): Promise<TargetSelection | null> {
  const scopeConstraint = resolveScopeConstraint(options);
  const wantsScopePrompt = !options.local && !options.global;

  let platforms: Platform[] = [];
  if (options.target) {
    platforms = [options.target as Platform];
  } else {
    const installedPlatforms = listInstalledPlatforms(scopeConstraint, skillName);
    if (installedPlatforms.length === 0) {
      console.log(chalk.red('No installed platforms found.'));
      process.exitCode = 1;
      return null;
    }

    if (interactive) {
      const selectedPlatforms = await promptPlatformsInteractive({
        defaultAll: true,
        platforms: installedPlatforms,
        installedPlatforms,
      });
      if (!selectedPlatforms) {
        console.log(chalk.red('No platforms selected.'));
        process.exitCode = 1;
        return null;
      }
      platforms = selectedPlatforms;
      flushInteractiveUiNow();
    } else {
      platforms = installedPlatforms;
    }
  }

  let scopes = scopeConstraint;
  const availableScopes = listAvailableScopes(platforms, skillName);
  if (availableScopes.length === 0) {
    console.log(chalk.red('No installed scopes found for selected platforms.'));
    process.exitCode = 1;
    return null;
  }

  if (wantsScopePrompt && interactive) {
    const selectedScopes = await promptScopesInteractive({ defaultAll: true, scopes: availableScopes });
    if (!selectedScopes) {
      console.log(chalk.red('No scopes selected.'));
      process.exitCode = 1;
      return null;
    }
    scopes = selectedScopes;
    flushInteractiveUiNow();
  } else if (wantsScopePrompt && !interactive) {
    scopes = availableScopes;
  } else {
    const filtered = scopes.filter(scope => availableScopes.includes(scope));
    if (filtered.length === 0) {
      console.log(chalk.red('Selected scopes have no installed skills.'));
      process.exitCode = 1;
      return null;
    }
    scopes = filtered;
    if (!options.json && filtered.length < scopeConstraint.length) {
      console.log(chalk.yellow('Note: some scopes were skipped because no installed skills were found.'));
    }
  }

  return { platforms, scopes };
}
