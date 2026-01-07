import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ensureDir } from './paths.js';

export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

export function isDirEmpty(dir: string): boolean {
  try {
    const entries = fs.readdirSync(dir);
    return entries.length === 0;
  } catch {
    return true;
  }
}

export function copyDir(src: string, dest: string): void {
  fs.cpSync(src, dest, { recursive: true });
}

export function removeDir(dir: string): void {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function sanitizeForPathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function createTempDir(parentDir: string, prefix: string): string {
  ensureDir(parentDir);
  const safePrefix = sanitizeForPathSegment(prefix || 'tmp');
  const template = path.join(parentDir, `.skild-${safePrefix}-`);
  return fs.mkdtempSync(template);
}

export function replaceDirAtomic(sourceDir: string, destDir: string): void {
  const backupDir = fs.existsSync(destDir) ? `${destDir}.bak-${Date.now()}` : null;

  try {
    if (backupDir) fs.renameSync(destDir, backupDir);
    fs.renameSync(sourceDir, destDir);
    if (backupDir) removeDir(backupDir);
  } catch (error) {
    try {
      if (!fs.existsSync(destDir) && backupDir && fs.existsSync(backupDir)) {
        fs.renameSync(backupDir, destDir);
      }
    } catch {
      // ignore rollback errors
    }
    try {
      if (fs.existsSync(sourceDir)) removeDir(sourceDir);
    } catch {
      // ignore cleanup errors
    }
    throw error;
  }
}

export function sha256File(filePath: string): string {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

export function sha256String(value: string): string {
  const h = crypto.createHash('sha256');
  h.update(value);
  return h.digest('hex');
}

export function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.skild') continue;
      if (entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) results.push(full);
    }
  }

  results.sort();
  return results;
}

export function hashDirectoryContent(rootDir: string): string {
  const files = listFilesRecursive(rootDir);
  const h = crypto.createHash('sha256');
  for (const filePath of files) {
    const rel = path.relative(rootDir, filePath);
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(filePath));
    h.update('\0');
  }
  return h.digest('hex');
}

