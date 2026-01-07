/**
 * CLI Constants - Centralized error messages and default values
 */

/**
 * Supported AI Agent platforms.
 */
export const PLATFORMS = ['claude', 'codex', 'copilot'] as const;

/**
 * Default platform when not specified.
 */
export const DEFAULT_PLATFORM = 'claude' as const;

/**
 * Error messages for consistent user feedback.
 */
export const ERROR_MESSAGES = {
    EMPTY_INSTALL_DIR: (source: string) =>
        `Installed directory is empty for source: ${source}\n` +
        `Source likely does not point to a valid subdirectory.\n` +
        `Try: https://github.com/<owner>/<repo>/tree/<branch>/skills/<skill-name>\n` +
        `Example: https://github.com/anthropics/skills/tree/main/skills/pdf`,

    INVALID_SOURCE: (source: string) =>
        `Unsupported source "${source}". Use a Git URL (e.g. https://github.com/owner/repo) or degit shorthand (e.g. owner/repo[/subdir][#ref]).`,

    NOT_A_DIRECTORY: (path: string) =>
        `Source path is not a directory: ${path}`,

    NO_SKILLS_INSTALLED: 'No skills installed.',

    INSTALL_HINT: 'Use `skild install <url>` to install a skill.',
} as const;

/**
 * Success messages.
 */
export const SUCCESS_MESSAGES = {
    SKILL_MD_FOUND: 'SKILL.md found ✓',
    SKILL_MD_WARNING: 'Warning: No SKILL.md found',
} as const;
