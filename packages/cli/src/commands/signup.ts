import chalk from 'chalk';
import { fetchWithTimeout, resolveRegistryUrl, SkildError } from '@skild/core';

export interface SignupCommandOptions {
  registry?: string;
  email: string;
  handle: string;
  password: string;
  json?: boolean;
}

export async function signup(options: SignupCommandOptions): Promise<void> {
  const registry = resolveRegistryUrl(options.registry);

  let text = '';
  try {
    const res = await fetchWithTimeout(
      `${registry}/auth/signup`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: options.email,
          handle: options.handle,
          password: options.password
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
  console.log(chalk.dim('Next: run `skild login --registry <url> --handle-or-email <...> --password <...>`'));
}
