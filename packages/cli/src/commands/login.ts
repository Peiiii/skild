import chalk from 'chalk';
import { fetchWithTimeout, resolveRegistryUrl, saveRegistryAuth, SkildError } from '@skild/core';
import { promptLine, promptPassword } from '../utils/prompt.js';

export interface LoginCommandOptions {
  registry?: string;
  handleOrEmail?: string;
  password?: string;
  tokenName?: string;
  json?: boolean;
}

export async function login(options: LoginCommandOptions): Promise<void> {
  const registry = resolveRegistryUrl(options.registry);
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  const handleOrEmail = options.handleOrEmail?.trim() || '';
  const password = options.password || '';
  if ((!handleOrEmail || !password) && (!interactive || options.json)) {
    console.error(chalk.red('Missing credentials. Use --handle-or-email and --password, or run `skild login` interactively.'));
    process.exitCode = 1;
    return;
  }

  const finalHandleOrEmail = handleOrEmail || (await promptLine('Handle or email'));
  const finalPassword = password || (await promptPassword('Password'));
  const finalTokenName = options.tokenName?.trim() || undefined;

  let text = '';
  try {
    const res = await fetchWithTimeout(
      `${registry}/auth/login`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          handleOrEmail: finalHandleOrEmail,
          password: finalPassword,
          tokenName: finalTokenName
        })
      },
      10_000
    );

    text = await res.text();
    if (!res.ok) {
      console.error(chalk.red(`Login failed (${res.status}): ${text}`));
      process.exitCode = 1;
      return;
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Login failed: ${message}`));
    process.exitCode = 1;
    return;
  }

  const json = JSON.parse(text) as {
    ok: boolean;
    token: string;
    publisher: { id: string; handle: string; email: string; emailVerified?: boolean };
  };

  saveRegistryAuth({
    schemaVersion: 1,
    registryUrl: registry,
    token: json.token,
    publisher: json.publisher,
    updatedAt: new Date().toISOString()
  });

  if (options.json) {
    console.log(JSON.stringify({ ok: true, publisher: json.publisher }, null, 2));
    return;
  }

  console.log(chalk.green(`Logged in as ${chalk.cyan(json.publisher.handle)}.`));
  if (json.publisher.emailVerified === false) {
    console.log(chalk.yellow('Email not verified. Publishing may be restricted by server policy.'));
    console.log(chalk.dim('Open the Publisher Console to verify: https://console.skild.sh/verify-email/request'));
  }
}
