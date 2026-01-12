import chalk from 'chalk';
import { fetchWithTimeout, resolveRegistryUrl, SkildError } from '@skild/core';
import { promptLine, promptPassword } from '../utils/prompt.js';

export interface SignupCommandOptions {
  registry?: string;
  email?: string;
  handle?: string;
  password?: string;
  json?: boolean;
}

export async function signup(options: SignupCommandOptions): Promise<void> {
  const registry = resolveRegistryUrl(options.registry);
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  const email = options.email?.trim() || '';
  const handle = options.handle?.trim() || '';
  const password = options.password || '';
  if ((!email || !handle || !password) && (!interactive || options.json)) {
    console.error(chalk.red('Missing signup fields. Use --email/--handle/--password, or run `skild signup` interactively.'));
    process.exitCode = 1;
    return;
  }

  const finalEmail = email || (await promptLine('Email'));
  const finalHandle = handle || (await promptLine('Handle (publisher scope)', undefined)).toLowerCase();
  const finalPassword = password || (await promptPassword('Password'));

  let text = '';
  try {
    const res = await fetchWithTimeout(
      `${registry}/auth/signup`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail,
          handle: finalHandle,
          password: finalPassword
        })
      },
      10_000
    );

    text = await res.text();
    if (!res.ok) {
      console.error(chalk.red(`Signup failed (${res.status}): ${text}`));
      process.exitCode = 1;
      return;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Signup failed: ${message}`));
    process.exitCode = 1;
    return;
  }

  if (options.json) {
    console.log(text || JSON.stringify({ ok: true }, null, 2));
    return;
  }

  console.log(chalk.green('Signup successful.'));
  try {
    const parsed = JSON.parse(text) as {
      ok: boolean;
      verification?: { requiredForPublish?: boolean; sent?: boolean; mode?: string; consoleUrl?: string };
    };
    if (parsed.verification?.requiredForPublish) {
      if (parsed.verification.mode === 'log') {
        console.log(chalk.dim('Dev mode: email sending is disabled. Check the registry dev logs for the verification link.'));
      } else if (parsed.verification.sent) {
        console.log(chalk.dim('Verification email sent. Check your inbox (and spam).'));
      } else {
        console.log(chalk.yellow('Verification email was not sent. You may need to resend from the Console.'));
      }
      console.log(chalk.dim(`Verify/resend in Console: ${(parsed.verification.consoleUrl || 'https://console.skild.sh').replace(/\/+$/, '')}/verify-email/request`));
    } else if (parsed.verification) {
      console.log(chalk.dim('Email verification is recommended. Publishing may be restricted in the future.'));
      console.log(chalk.dim(`Verify/resend in Console: ${(parsed.verification.consoleUrl || 'https://console.skild.sh').replace(/\/+$/, '')}/verify-email/request`));
    }
  } catch {
    // ignore non-JSON responses
  }
  console.log(chalk.dim('Next: run `skild login`'));
}
