import chalk from 'chalk';
import { loadRegistryAuth } from '@skild/core';

export async function whoami(): Promise<void> {
  const auth = loadRegistryAuth();
  if (!auth) {
    console.error(chalk.red('Not logged in. Run `skild login --registry <url> ...` first.'));
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${auth.registryUrl}/auth/me`, {
    headers: { authorization: `Bearer ${auth.token}`, accept: 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(chalk.red(`whoami failed (${res.status}): ${text}`));
    process.exitCode = 1;
    return;
  }
  const json = JSON.parse(text) as { ok: boolean; publisher: { handle: string; email: string } };
  console.log(chalk.cyan(json.publisher.handle));
}

