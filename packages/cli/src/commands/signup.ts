import chalk from 'chalk';

export interface SignupCommandOptions {
  registry: string;
  email: string;
  handle: string;
  password: string;
  json?: boolean;
}

export async function signup(options: SignupCommandOptions): Promise<void> {
  const registry = options.registry?.trim().replace(/\/+$/, '');
  if (!registry) {
    console.error(chalk.red('Missing --registry <url>.'));
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${registry}/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: options.email,
      handle: options.handle,
      password: options.password
    })
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(chalk.red(`Signup failed (${res.status}): ${text}`));
    process.exitCode = 1;
    return;
  }

  if (options.json) {
    console.log(text);
    return;
  }

  console.log(chalk.green('Signup successful.'));
  console.log(chalk.dim('Next: run `skild login --registry <url> --handle-or-email <...> --password <...>`'));
}

