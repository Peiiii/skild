export { SkildError } from './errors.js';
export { PLATFORMS } from './types.js';
export type {
  Platform,
  InstallScope,
  InstallOptions,
  ListOptions,
  UpdateOptions,
  SkillFrontmatter,
  SkillValidationResult,
  SkillValidationIssue,
  InstallRecord,
  Lockfile,
  GlobalConfig
} from './types.js';

export { loadOrCreateGlobalConfig } from './storage.js';
export { getSkillsDir, getSkillInstallDir } from './paths.js';
export { validateSkillDir } from './skill.js';
export { initSkill } from './init.js';
export {
  installSkill,
  listAllSkills,
  listSkills,
  getSkillInfo,
  uninstallSkill,
  updateSkill,
  validateSkill
} from './lifecycle.js';
