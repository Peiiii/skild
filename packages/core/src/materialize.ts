import fs from 'fs';
import os from 'os';
import path from 'path';
import degit from 'degit';
import type { SourceType } from './types.js';
import { classifySource, extractSkillName, resolveLocalPath, toDegitPath } from './source.js';
import { copyDir, createTempDir, isDirEmpty, isDirectory, removeDir } from './fs.js';
import { SkildError } from './errors.js';

function ensureInstallableDir(sourcePath: string): void {
  if (!isDirectory(sourcePath)) {
    throw new SkildError('NOT_A_DIRECTORY', `Source path is not a directory: ${sourcePath}`, { sourcePath });
  }
}

async function cloneRemote(degitSrc: string, targetPath: string): Promise<void> {
  const emitter = degit(degitSrc, { force: true, verbose: false });
  await emitter.clone(targetPath);
}

export async function materializeSourceToDir(input: {
  source: string;
  targetDir: string;
  materializedDir?: string | null;
}): Promise<{ sourceType: SourceType; materializedFrom: string }> {
  const sourceType = classifySource(input.source);
  const targetDir = path.resolve(input.targetDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const overridden = input.materializedDir?.trim() ? path.resolve(input.materializedDir.trim()) : null;
  if (overridden) {
    ensureInstallableDir(overridden);
    copyDir(overridden, targetDir);
    return { sourceType, materializedFrom: overridden };
  }

  const localPath = resolveLocalPath(input.source);
  if (localPath) {
    ensureInstallableDir(localPath);
    copyDir(localPath, targetDir);
    return { sourceType: 'local', materializedFrom: localPath };
  }

  const degitPath = toDegitPath(input.source);
  await cloneRemote(degitPath, targetDir);
  return { sourceType, materializedFrom: degitPath };
}

export async function materializeSourceToTemp(source: string): Promise<{ dir: string; cleanup: () => void; sourceType: SourceType }> {
  const sourceType = classifySource(source);
  const tempParent = path.join(os.tmpdir(), 'skild-materialize');
  const tempRoot = createTempDir(tempParent, extractSkillName(source));
  const dir = path.join(tempRoot, 'staging');
  fs.mkdirSync(dir, { recursive: true });

  try {
    await materializeSourceToDir({ source, targetDir: dir });
    if (isDirEmpty(dir)) {
      throw new SkildError(
        'EMPTY_INSTALL_DIR',
        `Installed directory is empty for source: ${source}\nSource likely does not point to a valid subdirectory.\nTry: https://github.com/<owner>/<repo>/tree/<branch>/skills/<skill-name>\nExample: https://github.com/anthropics/skills/tree/main/skills/pdf`,
        { source }
      );
    }
    return { dir, sourceType, cleanup: () => removeDir(tempRoot) };
  } catch (e) {
    removeDir(tempRoot);
    throw e;
  }
}

