import fs from 'fs';
import path from 'path';
import { ensureDir } from './paths.js';
import { SkildError } from './errors.js';

export interface InitOptions {
  force?: boolean;
  dir?: string;
  description?: string;
}

export function initSkill(name: string, options: InitOptions = {}): string {
  const targetDir = path.resolve(options.dir || name);
  if (fs.existsSync(targetDir) && !options.force) {
    throw new SkildError('ALREADY_INSTALLED', `Target directory already exists: ${targetDir}. Use --force to overwrite.`, { targetDir });
  }

  ensureDir(targetDir);
  ensureDir(path.join(targetDir, 'scripts'));
  ensureDir(path.join(targetDir, 'references'));
  ensureDir(path.join(targetDir, 'assets'));

  const description = options.description || 'Describe what this Skill does.';

  const skillMd = `---\nname: ${name}\ndescription: ${description}\n---\n\n## Instructions\n\n- Add your workflow instructions here.\n\n## Files\n\n- Put scripts in \`scripts/\`.\n- Put docs in \`references/\`.\n- Put static assets in \`assets/\`.\n`;

  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillMd, 'utf8');

  const runSh = `#!/usr/bin/env bash\nset -euo pipefail\n\necho \"${name}: run script placeholder\" \n`;
  fs.writeFileSync(path.join(targetDir, 'scripts', 'run.sh'), runSh, 'utf8');
  try {
    fs.chmodSync(path.join(targetDir, 'scripts', 'run.sh'), 0o755);
  } catch {
    // ignore
  }

  return targetDir;
}

