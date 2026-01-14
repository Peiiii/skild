import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

function repoRoot() {
  return path.resolve(import.meta.dirname, "../..");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findFreePort(preferredPort, { tries = 50 } = {}) {
  for (let i = 0; i < tries; i++) {
    const port = preferredPort + i;
    const ok = await new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.listen({ port, host: "127.0.0.1" }, () => {
        server.close(() => resolve(true));
      });
    });
    if (ok) return port;
  }
  throw new Error(`Failed to find a free port starting at ${preferredPort}`);
}

function run(name, command, args, { cwd, env } = {}) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...(env || {}) },
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exitCode = 1;
    }
  });
  return child;
}

async function runOnce(name, command, args, { cwd, env } = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, ...(env || {}) },
    });
    child.on("exit", (code) => {
      if (code && code !== 0) reject(new Error(`[${name}] exited with code ${code}`));
      else resolve();
    });
    child.on("error", reject);
  });
}

async function waitForHttpOk(url, { timeoutMs = 20_000 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
    if (registry?.exitCode != null && registry.exitCode !== 0) {
      throw new Error("Registry process exited early.");
    }
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(250);
  }
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === ".skild") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function replaceInFile(filePath, replacer) {
  const cur = fs.readFileSync(filePath, "utf8");
  const next = replacer(cur);
  fs.writeFileSync(filePath, next, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = repoRoot();
const tmpRoot = fs.mkdtempSync(path.join(root, ".tmp", "skillset-kitchen-sink-smoke."));

const skildHome = path.join(tmpRoot, "skild-home");
fs.mkdirSync(skildHome, { recursive: true });

const projectDir = path.join(tmpRoot, "project");
fs.mkdirSync(projectDir, { recursive: true });

const registryPort = process.env.SKILD_REGISTRY_PORT
  ? Number.parseInt(process.env.SKILD_REGISTRY_PORT, 10)
  : await findFreePort(18787);
const registryUrl = `http://localhost:${registryPort}`;

const handle = `skillsetdemo${Date.now()}`;
const email = `${handle}@example.com`;
const password = "test-password";

const kitchenSinkSrc = path.join(root, "examples", "kitchen-sink-skillset");
const kitchenSinkCopy = path.join(tmpRoot, "kitchen-sink-skillset");
copyDir(kitchenSinkSrc, kitchenSinkCopy);
replaceInFile(path.join(kitchenSinkCopy, "SKILL.md"), (content) =>
  content.replaceAll("__REGISTRY_SCOPE__", handle),
);

const cliEntry = path.join(root, "packages", "cli", "dist", "index.js");
const registryDepDir = path.join(root, "examples", "registry-dep-skill");

let registry = null;
function shutdown(code = 0) {
  try {
    registry?.kill("SIGTERM");
  } catch {
    // ignore
  }
  process.exit(code);
}
process.on("SIGINT", () => shutdown(process.exitCode || 0));
process.on("SIGTERM", () => shutdown(process.exitCode || 0));

try {
  console.log(`[smoke] tmp: ${tmpRoot}`);
  console.log(`[smoke] registry: ${registryUrl}`);
  console.log(`[smoke] handle: ${handle}`);

  await runOnce(
    "registry:migrate",
    "pnpm",
    ["-C", "workers/registry", "exec", "wrangler", "d1", "migrations", "apply", "skild-registry", "--local"],
    { cwd: root },
  );

  registry = run(
    "registry",
    "pnpm",
    [
      "-C",
      "workers/registry",
      "exec",
      "wrangler",
      "dev",
      "src/index.ts",
      "--local",
      "--port",
      String(registryPort),
      "--persist-to",
      ".wrangler/state",
      "--var",
      `EMAIL_MODE:log`,
      "--var",
      `REGISTRY_PUBLIC_URL:${registryUrl}`,
      "--var",
      `CONSOLE_PUBLIC_URL:http://localhost:5173`,
    ],
    { cwd: root },
  );

  await waitForHttpOk(`${registryUrl}/health`, { timeoutMs: 30_000 });

  const cliEnv = { SKILD_HOME: skildHome };

  await runOnce(
    "cli:signup",
    "node",
    [cliEntry, "signup", "--registry", registryUrl, "--email", email, "--handle", handle, "--password", password, "--json"],
    { cwd: root, env: cliEnv },
  );

  await runOnce(
    "cli:login",
    "node",
    [
      cliEntry,
      "login",
      "--registry",
      registryUrl,
      "--handle-or-email",
      handle,
      "--password",
      password,
      "--token-name",
      "skillset-kitchen-sink-smoke",
      "--json",
    ],
    { cwd: root, env: cliEnv },
  );

  await runOnce(
    "cli:publish:dep",
    "node",
    [cliEntry, "publish", "--dir", registryDepDir, "--name", "registry-dep-skill", "--registry", registryUrl, "--json"],
    { cwd: root, env: cliEnv },
  );

  await runOnce(
    "cli:install:registry-latest",
    "node",
    [cliEntry, "install", `@${handle}/registry-dep-skill`, "--target", "codex", "--local", "--json"],
    { cwd: projectDir, env: cliEnv },
  );

  await runOnce(
    "cli:install:skillset",
    "node",
    [cliEntry, "install", kitchenSinkCopy, "--target", "codex", "--local", "--json"],
    { cwd: projectDir, env: cliEnv },
  );

  const installDir = path.join(projectDir, ".codex", "skills", "kitchen-sink-skillset");
  const installRecordPath = path.join(installDir, ".skild", "install.json");
  const record = readJson(installRecordPath);

  assert(record.skillset === true, "Expected install record to be a skillset.");
  assert(Array.isArray(record.installedDependencies) && record.installedDependencies.length >= 3, "Expected >= 3 dependencies.");
  const sourceTypes = new Set(record.installedDependencies.map((d) => d.sourceType));
  assert(sourceTypes.has("inline"), "Expected inline dependency.");
  assert(sourceTypes.has("registry"), "Expected registry dependency.");
  assert(sourceTypes.has("degit-shorthand") || sourceTypes.has("github-url"), "Expected GitHub dependency.");

  const expectedRegistryInstallDir = path.join(projectDir, ".codex", "skills", `${handle}__registry-dep-skill`);
  assert(fs.existsSync(expectedRegistryInstallDir), "Expected registry dependency to be installed at top-level.");

  console.log("[smoke] ok");
  shutdown(0);
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  shutdown(1);
}
