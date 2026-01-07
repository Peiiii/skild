/**
 * List Command - List installed skills
 */

import path from 'path';
import { ensureSkillsDir } from '../utils/config.js';
import { getSubdirectories, hasSkillMd } from '../utils/fs-helpers.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_PLATFORM, ERROR_MESSAGES } from '../constants.js';
import type { ListOptions, Platform } from '../types/index.js';

// Re-export types for backward compatibility
export type { ListOptions };

/**
 * List all installed skills for a platform.
 * 
 * @param options - List options
 */
export async function list(options: ListOptions = {}): Promise<void> {
    const platform: Platform = options.target || DEFAULT_PLATFORM;
    const projectLevel = options.local || false;
    const skillsDir = ensureSkillsDir(platform, projectLevel);

    const skills = getSubdirectories(skillsDir);

    if (skills.length === 0) {
        logger.dim(ERROR_MESSAGES.NO_SKILLS_INSTALLED);
        logger.dim(ERROR_MESSAGES.INSTALL_HINT);
        return;
    }

    const locationLabel = projectLevel ? 'project' : 'global';
    logger.header(`\n📦 Installed Skills (${skills.length}) — ${platform} (${locationLabel}):\n`);

    for (const skillName of skills) {
        const skillPath = path.join(skillsDir, skillName);
        const hasSkill = hasSkillMd(skillPath);
        logger.skillEntry(skillName, skillPath, hasSkill);
    }

    console.log('');
}
