import chalk from 'chalk';
import { fetchWithTimeout, loadRegistryAuth, resolveRegistryUrl, SkildError } from '@skild/core';

export async function whoami(): Promise<void> {
  const auth = loadRegistryAuth();
  if (!auth) {
    console.error(chalk.red('Not logged in. Run `skild login` first.'));
    process.exitCode = 1;
    return;
  }

  const registryUrl = resolveRegistryUrl(auth.registryUrl);

  try {
    const res = await fetchWithTimeout(
      `${registryUrl}/auth/me`,
      { headers: { authorization: `Bearer ${auth.token}`, accept: 'application/json' } },
      5_000
    );
    const text = await res.text();
    if (!res.ok) {
      console.error(chalk.red(`whoami failed (${res.status}): ${text}`));
      process.exitCode = 1;
      return;
    }
    const json = JSON.parse(text) as { ok: boolean; publisher: { handle: string; email: string } };
    console.log(chalk.cyan(json.publisher.handle));
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`whoami failed: ${message}`));
    console.error(chalk.dim('Tip: if you previously logged into a local registry, run `skild logout` then `skild login`.'));
    process.exitCode = 1;
  }
}
