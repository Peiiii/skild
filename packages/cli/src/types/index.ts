/**
 * CLI Type Definitions - Unified type exports and guards
 */

import { PLATFORMS } from '../constants.js';

/**
 * Supported AI Agent platforms.
 */
export type Platform = (typeof PLATFORMS)[number];

/**
 * Type guard to check if a value is a valid Platform.
 */
export function isPlatform(value: string | undefined): value is Platform {
    return typeof value === 'string' && PLATFORMS.includes(value as Platform);
}

/**
 * Install command options.
 */
export interface InstallOptions {
    target?: Platform;
    local?: boolean;
}

/**
 * List command options.
 */
export interface ListOptions {
    target?: Platform;
    local?: boolean;
}

/**
 * Source type classification.
 */
export type SourceType = 'local' | 'github-url' | 'degit-shorthand' | 'unknown';
