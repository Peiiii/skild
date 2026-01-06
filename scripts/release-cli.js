import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('packages/cli/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

console.log(`🚀 Releasing ${pkg.name} v${pkg.version}...`);

try {
  // 1. Build
  console.log('📦 Building package...');
  execSync('pnpm build:cli', { stdio: 'inherit' });

  // 2. Publish (Access is set in package.json, but explicit here for safety)
  console.log('📤 Publishing to npm...');
  execSync('cd packages/cli && npm publish --access public', { stdio: 'inherit' });

  console.log('✅ Release successful!');
} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}
