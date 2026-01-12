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
  GlobalConfig,
  RegistryAuth
} from './types.js';

export { loadOrCreateGlobalConfig, loadRegistryAuth, saveRegistryAuth, clearRegistryAuth } from './storage.js';
export { getSkillsDir, getSkillInstallDir } from './paths.js';
export { validateSkillDir } from './skill.js';
export { initSkill } from './init.js';
export {
  canonicalNameToInstallDirName,
  splitCanonicalName,
  parseRegistrySpecifier,
  resolveRegistryUrl,
  resolveRegistryVersion,
  downloadAndExtractTarball
} from './registry.js';
export {
  installSkill,
  installRegistrySkill,
  listAllSkills,
  listSkills,
  getSkillInfo,
  uninstallSkill,
  updateSkill,
  validateSkill
} from './lifecycle.js';
