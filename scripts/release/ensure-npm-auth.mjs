import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);

export function hasNpmToken() {
  return Boolean(process.env.NPM_TOKEN?.trim());
}

function hasOtpArg(args) {
  const otpIndex = args.indexOf("--otp");
  if (otpIndex !== -1) return true;
  return args.some((arg) => arg.startsWith("--otp="));
}

async function getNpmUser() {
  try {
    const { stdout } = await execFileAsync("npm", ["whoami"], {
      encoding: "utf8",
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getTwoFactorMode() {
  try {
    const { stdout } = await execFileAsync("npm", ["profile", "get", "--json"], {
      encoding: "utf8",
    });
    const parsed = JSON.parse(stdout);
    const mode = parsed["two-factor auth"];
    return typeof mode === "string" ? mode : null;
  } catch {
    return null;
  }
}

export async function ensureNpmAuth(args = process.argv.slice(2)) {
  const hasToken = hasNpmToken();
  if (hasToken) return;

  const npmUser = await getNpmUser();
  if (!npmUser) {
    console.error(
      [
        "Missing npm auth for publishing.",
        "",
        "Fix options:",
        "- Recommended (non-interactive): set an npm Automation Token as NPM_TOKEN.",
        "- Or login: npm login --auth-type=web",
        "- Or pass OTP: pnpm release -- --otp=123456",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  if (hasOtpArg(args)) return;

  const twoFactorMode = await getTwoFactorMode();
  if (twoFactorMode === "auth-and-writes") {
    console.error(
      [
        `npm user "${npmUser}" has 2FA enabled for publishing (auth-and-writes).`,
        "This release flow is non-interactive and will hang waiting for an OTP prompt.",
        "",
        "Fix options:",
        "- Recommended: set NPM_TOKEN (Automation Token) and rerun pnpm release",
        "- Or rerun with OTP: pnpm release -- --otp=123456",
      ].join("\n"),
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureNpmAuth().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
