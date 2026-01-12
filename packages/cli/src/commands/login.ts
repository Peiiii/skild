import chalk from 'chalk';
import { saveRegistryAuth } from '@skild/core';

export interface LoginCommandOptions {
  registry: string;
  handleOrEmail: string;
  password: string;
  tokenName?: string;
  json?: boolean;
}

export async function login(options: LoginCommandOptions): Promise<void> {
  const registry = options.registry?.trim().replace(/\/+$/, '');
  if (!registry) {
    console.error(chalk.red('Missing --registry <url>.'));
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${registry}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      handleOrEmail: options.handleOrEmail,
      password: options.password,
      tokenName: options.tokenName
    })
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(chalk.red(`Login failed (${res.status}): ${text}`));
    process.exitCode = 1;
    return;
  }

  const json = JSON.parse(text) as {
    ok: boolean;
    token: string;
    publisher: { id: string; handle: string; email: string };
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
}

