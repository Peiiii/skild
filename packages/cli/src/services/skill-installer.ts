/**
 * Skill Installer - Core installation logic
 */

import degit from 'degit';
import path from 'path';
import {
    createTempDir,
    hasSkillMd,
    isDirEmpty,
    isDirectory,
    copyDir,
    replaceDirAtomic,
    safeRemoveDir
} from '../utils/fs-helpers.js';
import { extractSkillName, toDegitPath, classifySource, resolveLocalPath } from './source-parser.js';
import { ensureSkillsDir, getSkillPath, getSkillsDir } from '../utils/config.js';
import { ERROR_MESSAGES, DEFAULT_PLATFORM } from '../constants.js';
import type { InstallOptions, Platform, SourceType } from '../types/index.js';

export interface InstallContext {
    source: string;
    sourceType: SourceType;
    localPath: string | null;
    degitPath: string | null;
    skillName: string;
    platform: Platform;
    projectLevel: boolean;
    skillsDir: string;
    targetPath: string;
    locationLabel: 'project' | 'global';
}

export interface InstallResult {
    skillName: string;
    platform: Platform;
    projectLevel: boolean;
    targetPath: string;
    hasSkillMd: boolean;
}

/**
 * Clone a remote repository using degit.
 */
async function cloneRemote(degitSrc: string, targetPath: string): Promise<void> {
    const emitter = degit(degitSrc, { force: true, verbose: false });
    await emitter.clone(targetPath);
}

/**
 * Copy a local directory to the target path.
 */
function copyLocal(sourcePath: string, targetPath: string): void {
    if (!isDirectory(sourcePath)) {
        throw new Error(ERROR_MESSAGES.NOT_A_DIRECTORY(sourcePath));
    }
    copyDir(sourcePath, targetPath);
}

/**
 * Validate that the staging directory contains files.
 */
function validateStaging(stagingPath: string, source: string): void {
    if (isDirEmpty(stagingPath)) {
        throw new Error(ERROR_MESSAGES.EMPTY_INSTALL_DIR(source));
    }
}

export function resolveInstallContext(source: string, options: InstallOptions = {}): InstallContext {
    const platform: Platform = options.target || DEFAULT_PLATFORM;
    const projectLevel = options.local || false;

    const skillName = extractSkillName(source);
    const skillsDir = getSkillsDir(platform, projectLevel);
    const targetPath = getSkillPath(skillName, platform, projectLevel);
    const locationLabel = projectLevel ? 'project' : 'global';

    const localPath = resolveLocalPath(source);
    const sourceType = localPath ? 'local' : classifySource(source);
    if (!localPath && sourceType === 'unknown') {
        throw new Error(ERROR_MESSAGES.INVALID_SOURCE(source));
    }

    const degitPath = localPath ? null : toDegitPath(source);

    return {
        source,
        sourceType,
        localPath,
        degitPath,
        skillName,
        platform,
        projectLevel,
        skillsDir,
        targetPath,
        locationLabel
    };
}

/**
 * Install a skill from a source.
 * 
 * @param source - Git URL, degit shorthand, or local path
 * @param options - Installation options
 */
export async function installSkillFromContext(context: InstallContext): Promise<InstallResult> {
    ensureSkillsDir(context.platform, context.projectLevel);

    const tempRoot = createTempDir(context.skillsDir, context.skillName);
    const stagingPath = path.join(tempRoot, 'staging');

    try {
        if (context.localPath) {
            copyLocal(context.localPath, stagingPath);
        } else {
            if (!context.degitPath) {
                throw new Error(ERROR_MESSAGES.INVALID_SOURCE(context.source));
            }
            await cloneRemote(context.degitPath, stagingPath);
        }

        validateStaging(stagingPath, context.source);
        replaceDirAtomic(stagingPath, context.targetPath);

        return {
            skillName: context.skillName,
            platform: context.platform,
            projectLevel: context.projectLevel,
            targetPath: context.targetPath,
            hasSkillMd: hasSkillMd(context.targetPath)
        };
    } finally {
        safeRemoveDir(tempRoot);
    }
}

export async function installSkill(source: string, options: InstallOptions = {}): Promise<InstallResult> {
    const context = resolveInstallContext(source, options);
    return installSkillFromContext(context);
}
