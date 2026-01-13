import { spawn } from "node:child_process";
import net from "node:net";

function isSmokeMode() {
  const raw = (process.env.SKILD_DEV_SMOKE || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

async function findFreePort(preferredPort, { tries = 50 } = {}) {
  for (let i = 0; i < tries; i++) {
    const port = preferredPort + i;
    const ok = await new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
    });
    if (ok) return port;
  }
  throw new Error(`Failed to find a free port starting at ${preferredPort}`);
}

function run(name, command, args, { env } = {}) {
  const child = spawn(command, args, {
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

async function runOnce(name, command, args, { env } = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

async function waitForHttpOk(url, { timeoutMs = 15_000 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const registryPort = process.env.SKILD_REGISTRY_PORT
  ? Number.parseInt(process.env.SKILD_REGISTRY_PORT, 10)
  : await findFreePort(18787);
const consolePort = process.env.SKILD_CONSOLE_PORT
  ? Number.parseInt(process.env.SKILD_CONSOLE_PORT, 10)
  : await findFreePort(5173);

const registryUrl = `http://localhost:${registryPort}`;
const consoleUrl = `http://localhost:${consolePort}`;

console.log(`[skild] dev registry: ${registryUrl}`);
console.log(`[skild] dev console:  ${consoleUrl}`);

await runOnce(
  "registry:migrate",
  "pnpm",
  ["-C", "workers/registry", "exec", "wrangler", "d1", "migrations", "apply", "skild-registry", "--local"],
  {},
);

const registry = run(
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
    `CONSOLE_PUBLIC_URL:${consoleUrl}`,
  ],
  {},
);

const consoleApp = run(
  "console",
  "pnpm",
  ["-C", "apps/console", "dev", "--", "--port", String(consolePort), "--strictPort"],
  { env: { VITE_REGISTRY_URL: registryUrl } },
);

function shutdown(code = 0) {
  try {
    registry.kill("SIGTERM");
  } catch {
    // ignore
  }
  try {
    consoleApp.kill("SIGTERM");
  } catch {
    // ignore
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(process.exitCode || 0));
process.on("SIGTERM", () => shutdown(process.exitCode || 0));

if (isSmokeMode()) {
  try {
    await waitForHttpOk(`${registryUrl}/health`, { timeoutMs: 20_000 });
    await waitForHttpOk(`${consoleUrl}/`, { timeoutMs: 20_000 });
    console.log("[skild] dev smoke ok");
    shutdown(0);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    shutdown(1);
  }
}
