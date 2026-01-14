import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { SkillFrontmatter, SkillValidationIssue, SkillValidationResult } from './types.js';
import { SkildError } from './errors.js';

export function readSkillMd(skillDir: string): string | null {
  const filePath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function parseSkillFrontmatter(skillMdContent: string): SkillFrontmatter | null {
  const trimmed = skillMdContent.trimStart();
  if (!trimmed.startsWith('---')) return null;

  const end = trimmed.indexOf('\n---', 3);
  if (end === -1) return null;

  const yamlBlock = trimmed.slice(3, end).trim();
  const parsed = yaml.load(yamlBlock);
  if (!parsed || typeof parsed !== 'object') return null;

  return parsed as SkillFrontmatter;
}

export function validateSkillDir(skillDir: string): SkillValidationResult {
  const issues: SkillValidationIssue[] = [];
  const skillMd = readSkillMd(skillDir);
  if (!skillMd) {
    issues.push({ level: 'error', message: 'Missing SKILL.md', path: path.join(skillDir, 'SKILL.md') });
    return { ok: false, issues };
  }

  const frontmatter = parseSkillFrontmatter(skillMd);
  if (!frontmatter) {
    issues.push({ level: 'error', message: 'SKILL.md is missing valid YAML frontmatter (--- ... ---)' });
    return { ok: false, issues };
  }

  if (!frontmatter.name || typeof frontmatter.name !== 'string') {
    issues.push({ level: 'error', message: 'Frontmatter "name" is required and must be a string' });
  }
  if (!frontmatter.description || typeof frontmatter.description !== 'string') {
    issues.push({ level: 'error', message: 'Frontmatter "description" is required and must be a string' });
  }
  if (frontmatter.skillset !== undefined && typeof frontmatter.skillset !== 'boolean') {
    issues.push({ level: 'error', message: 'Frontmatter "skillset" must be a boolean when provided' });
  }
  if (frontmatter.dependencies !== undefined) {
    const deps = frontmatter.dependencies;
    if (!Array.isArray(deps) || deps.some(dep => typeof dep !== 'string')) {
      issues.push({ level: 'error', message: 'Frontmatter "dependencies" must be an array of strings when provided' });
    }
  }

  return { ok: issues.every(i => i.level !== 'error'), issues, frontmatter };
}

export function assertValidSkillDir(skillDir: string): SkillValidationResult {
  const result = validateSkillDir(skillDir);
  if (!result.ok) {
    throw new SkildError('INVALID_SKILL', 'Skill validation failed', { result });
  }
  return result;
}
