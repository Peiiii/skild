import chalk from 'chalk';
import { resolveRegistryUrl, searchRegistrySkills, SkildError } from '@skild/core';

export interface SearchCommandOptions {
  registry?: string;
  limit?: string;
  json?: boolean;
}

export async function search(query: string, options: SearchCommandOptions = {}): Promise<void> {
  const registryUrl = resolveRegistryUrl(options.registry);
  const limit = Math.min(Math.max(Number.parseInt(options.limit || '50', 10) || 50, 1), 100);

  try {
    const skills = await searchRegistrySkills(registryUrl, query, limit);

    if (options.json) {
      console.log(JSON.stringify({ ok: true, registryUrl, skills }, null, 2));
      return;
    }

    if (!skills.length) {
      console.log(chalk.dim('No results.'));
      return;
    }

    console.log(chalk.bold(`\n🔎 Results (${skills.length}) — ${chalk.dim(registryUrl)}\n`));
    for (const s of skills) {
      const name = String((s as any).name || '').trim();
      const desc = String((s as any).description || '').trim();
      if (!name) continue;
      console.log(`  ${chalk.cyan(name)}${desc ? chalk.dim(` — ${desc}`) : ''}`);
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

