import { spawn } from "node:child_process";
import path from "node:path";
import {
  ensureNpmAuth,
  getRepoLocalPublishNpmrcPath,
  hasNpmToken,
} from "./ensure-npm-auth.mjs";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

const extraArgs = process.argv.slice(2);

await ensureNpmAuth(extraArgs);
if (process.exitCode) process.exit(process.exitCode);

await run("pnpm", ["release:check"]);

const publishEnv = { ...process.env };
const repoLocalUserconfig = getRepoLocalPublishNpmrcPath();
if (repoLocalUserconfig) publishEnv.NPM_CONFIG_USERCONFIG = repoLocalUserconfig;
else if (hasNpmToken()) publishEnv.NPM_CONFIG_USERCONFIG = path.resolve(process.cwd(), ".npmrc.publish");

await run("pnpm", ["changeset", "publish", ...extraArgs], { env: publishEnv });
