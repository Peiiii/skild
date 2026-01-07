import os from 'os';
import path from 'path';
import fs from 'fs';
import { DEFAULT_PLATFORM } from '../constants.js';
import type { Platform } from '../types/index.js';

// Re-export for backward compatibility
export type { Platform };
export { DEFAULT_PLATFORM };

/**
 * Get the skills directory for a specific platform.
 * @param platform - The target platform (claude, codex, copilot)
 * @param projectLevel - If true, return project-level path (cwd), else global path (~)
 */
export function getSkillsDir(platform: Platform = DEFAULT_PLATFORM, projectLevel = false): string {
    const base = projectLevel ? process.cwd() : os.homedir();

    switch (platform) {
        case 'claude':
            return path.join(base, '.claude', 'skills');
        case 'codex':
            return path.join(base, '.codex', 'skills');
        case 'copilot':
            return path.join(base, '.github', 'skills');
        default:
            return path.join(base, '.claude', 'skills');
    }
}

/** 
 * Legacy: Default directory (for backward compatibility)
 */
export const SKILLS_DIR = getSkillsDir(DEFAULT_PLATFORM, false);

/**
 * Ensure the skills directory exists.
 */
export function ensureSkillsDir(platform: Platform = DEFAULT_PLATFORM, projectLevel = false): string {
    const dir = getSkillsDir(platform, projectLevel);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Get the path to a specific skill.
 */
export function getSkillPath(skillName: string, platform: Platform = DEFAULT_PLATFORM, projectLevel = false): string {
    return path.join(getSkillsDir(platform, projectLevel), skillName);
}
