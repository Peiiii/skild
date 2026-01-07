/**
 * CLI File System Helpers - Common FS operations
 */

import fs from 'fs';
import path from 'path';

/**
 * Check if a directory is empty.
 */
export function isDirEmpty(dir: string): boolean {
    try {
        const entries = fs.readdirSync(dir);
        return entries.length === 0;
    } catch {
        return true;
    }
}

/**
 * Safely remove a directory if it exists.
 */
export function safeRemoveDir(dir: string): void {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Check if a path exists and is a directory.
 */
export function isDirectory(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isDirectory();
    } catch {
        return false;
    }
}

/**
 * Check if a path exists.
 */
export function pathExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

/**
 * Copy a directory recursively.
 */
export function copyDir(src: string, dest: string): void {
    fs.cpSync(src, dest, { recursive: true });
}

/**
 * Check if SKILL.md exists in a directory.
 */
export function hasSkillMd(skillPath: string): boolean {
    return fs.existsSync(path.join(skillPath, 'SKILL.md'));
}

/**
 * Get all subdirectories in a directory.
 */
export function getSubdirectories(dir: string): string[] {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory())
            .map(e => e.name);
    } catch {
        return [];
    }
}

function sanitizeForPathSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Create a temporary directory inside the given parent directory.
 * The directory is created within the same filesystem to allow atomic renames.
 */
export function createTempDir(parentDir: string, prefix: string): string {
    const safePrefix = sanitizeForPathSegment(prefix || 'tmp');
    const template = path.join(parentDir, `.skild-${safePrefix}-`);
    return fs.mkdtempSync(template);
}

/**
 * Atomically replace a destination directory with a source directory (same parent preferred).
 * Rolls back on failure.
 */
export function replaceDirAtomic(sourceDir: string, destDir: string): void {
    const backupDir = fs.existsSync(destDir) ? `${destDir}.bak-${Date.now()}` : null;

    try {
        if (backupDir) {
            fs.renameSync(destDir, backupDir);
        }

        fs.renameSync(sourceDir, destDir);

        if (backupDir) {
            safeRemoveDir(backupDir);
        }
    } catch (error) {
        // Best-effort rollback
        try {
            if (!fs.existsSync(destDir) && backupDir && fs.existsSync(backupDir)) {
                fs.renameSync(backupDir, destDir);
            }
        } catch {
            // ignore rollback errors
        }

        try {
            if (fs.existsSync(sourceDir)) {
                safeRemoveDir(sourceDir);
            }
        } catch {
            // ignore cleanup errors
        }

        throw error;
    }
}
