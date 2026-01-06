const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const cliDir = path.join(repoRoot, "packages", "cli");

if (!fs.existsSync(path.join(cliDir, "package.json"))) {
  console.error(`Missing CLI package at ${cliDir}`);
  process.exit(1);
}

const releaseItBin = require.resolve("release-it/bin/release-it.js", {
  paths: [repoRoot],
});

const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [releaseItBin, ...args], {
  cwd: cliDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

