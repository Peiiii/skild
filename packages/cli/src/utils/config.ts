import os from 'os';
import path from 'path';
import fs from 'fs';

/** 
 * Default directory where Skills are installed.
 * Located in user's home directory.
 */
export const SKILLS_DIR = path.join(os.homedir(), '.agent-skills');

/**
 * Ensure the skills directory exists.
 */
export function ensureSkillsDir(): void {
    if (!fs.existsSync(SKILLS_DIR)) {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }
}

/**
 * Get the path to a specific skill.
 */
export function getSkillPath(skillName: string): string {
    return path.join(SKILLS_DIR, skillName);
}
