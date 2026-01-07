/**
 * Source Parser - URL and path parsing utilities
 */

import path from 'path';
import { pathExists } from '../utils/fs-helpers.js';
import type { SourceType } from '../types/index.js';

/**
 * Classify the type of source input.
 */
export function classifySource(source: string): SourceType {
    // Check local path first
    const resolvedPath = path.resolve(source);
    if (pathExists(resolvedPath)) {
        return 'local';
    }

    // Check for full GitHub URL
    if (/^https?:\/\//i.test(source) || source.includes('github.com')) {
        return 'github-url';
    }

    // Check for degit shorthand (owner/repo pattern)
    if (/^[^/]+\/[^/]+/.test(source)) {
        return 'degit-shorthand';
    }

    return 'unknown';
}

/**
 * Extract a reasonable skill name from a source (URL/degit shorthand/local path).
 * 
 * @example
 * extractSkillName('https://github.com/anthropics/skills/tree/main/skills/pdf') // -> 'pdf'
 * extractSkillName('https://github.com/user/skill-name') // -> 'skill-name'
 * extractSkillName('anthropics/skills/skills/pdf#main') // -> 'pdf'
 */
export function extractSkillName(url: string): string {
    // Handle local paths
    const maybeLocalPath = path.resolve(url);
    if (pathExists(maybeLocalPath)) {
        return path.basename(maybeLocalPath) || 'unknown-skill';
    }

    const cleaned = url.replace(/[#?].*$/, '');

    // Handle tree URLs (subdirectory)
    const treeMatch = cleaned.match(/\/tree\/[^/]+\/(.+?)(?:\/)?$/);
    if (treeMatch) {
        return treeMatch[1].split('/').pop() || 'unknown-skill';
    }

    // Handle standard repo URLs
    const repoMatch = cleaned.match(/github\.com\/[^/]+\/([^/]+)/);
    if (repoMatch) {
        return repoMatch[1].replace(/\.git$/, '');
    }

    // Handle degit shorthand (owner/repo[/subpath])
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length >= 2) {
        return parts[parts.length - 1] || 'unknown-skill';
    }

    return cleaned || 'unknown-skill';
}

/**
 * Convert GitHub URL to degit-compatible format.
 * 
 * @example
 * toDegitPath('https://github.com/anthropics/skills/tree/main/skills/pdf') // -> 'anthropics/skills/skills/pdf#main'
 * toDegitPath('https://github.com/user/repo') // -> 'user/repo'
 */
export function toDegitPath(url: string): string {
    // Handle tree URLs (subdirectory)
    const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)(?:\/)?$/);
    if (treeMatch) {
        const [, owner, repo, branch, subpath] = treeMatch;
        return `${owner}/${repo}/${subpath}#${branch}`;
    }

    // Handle standard repo URLs
    const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (repoMatch) {
        return repoMatch[1].replace(/\.git$/, '');
    }

    // Fallback: assume it's already in degit format
    return url;
}

/**
 * Check if the source is a valid remote source format.
 */
export function isValidRemoteSource(source: string): boolean {
    const type = classifySource(source);
    return type === 'github-url' || type === 'degit-shorthand';
}

/**
 * Resolve the local path if it's a local source, otherwise return null.
 */
export function resolveLocalPath(source: string): string | null {
    const resolvedPath = path.resolve(source);
    return pathExists(resolvedPath) ? resolvedPath : null;
}
