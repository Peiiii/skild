import chalk from 'chalk';
import {
  SkildError,
  loadOrCreateGlobalConfig,
  saveGlobalConfig,
  PLATFORMS,
  type GlobalConfig
} from '@skild/core';

export interface ConfigCommandOptions {
  json?: boolean;
}

type ConfigKey = 'defaultPlatform' | 'defaultScope' | 'push.defaultRepo';

const CONFIG_KEYS: ConfigKey[] = ['defaultPlatform', 'defaultScope', 'push.defaultRepo'];

const CONFIG_ALIASES: Record<string, ConfigKey> = {
  'push.repo': 'push.defaultRepo',
  'push.default': 'push.defaultRepo'
};

const DEFAULT_SCOPE = 'global';

function normalizeKey(raw: string): { key: ConfigKey; alias?: string } {
  const trimmed = raw.trim();
  const aliased = CONFIG_ALIASES[trimmed];
  const key = (aliased || trimmed) as ConfigKey;
  if (!CONFIG_KEYS.includes(key)) {
    throw new SkildError(
      'INVALID_SOURCE',
      `Unknown config key "${raw}". Available: ${CONFIG_KEYS.join(', ')}`
    );
  }
  return { key, alias: aliased ? trimmed : undefined };
}

function normalizeValue(key: ConfigKey, raw: string): string {
  const value = raw.trim();
  if (!value) {
    throw new SkildError('INVALID_SOURCE', `Value for ${key} cannot be empty.`);
  }

  if (key === 'defaultPlatform') {
    if (!PLATFORMS.includes(value as (typeof PLATFORMS)[number])) {
      throw new SkildError('INVALID_SOURCE', `defaultPlatform must be one of: ${PLATFORMS.join(', ')}`);
    }
    return value;
  }

  if (key === 'defaultScope') {
    if (value !== 'global' && value !== 'project') {
      throw new SkildError('INVALID_SOURCE', 'defaultScope must be "global" or "project".');
    }
    return value;
  }

  return value;
}

function getValue(config: GlobalConfig, key: ConfigKey): string | undefined {
  switch (key) {
    case 'defaultPlatform':
      return config.defaultPlatform;
    case 'defaultScope':
      return config.defaultScope;
    case 'push.defaultRepo':
      return config.push?.defaultRepo;
  }
}

function setValue(config: GlobalConfig, key: ConfigKey, value: string): void {
  switch (key) {
    case 'defaultPlatform':
      config.defaultPlatform = value as (typeof PLATFORMS)[number];
      return;
    case 'defaultScope':
      config.defaultScope = value === 'project' ? 'project' : DEFAULT_SCOPE;
      return;
    case 'push.defaultRepo':
      config.push = { ...config.push, defaultRepo: value };
      return;
  }
}

function unsetValue(config: GlobalConfig, key: ConfigKey): void {
  switch (key) {
    case 'defaultPlatform':
      config.defaultPlatform = PLATFORMS[0];
      return;
    case 'defaultScope':
      config.defaultScope = DEFAULT_SCOPE;
      return;
    case 'push.defaultRepo':
      if (config.push) delete config.push.defaultRepo;
      if (config.push && !config.push.defaultRepo) delete config.push;
      return;
  }
}

export async function configGet(key: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    const normalized = normalizeKey(key);
    const config = loadOrCreateGlobalConfig();
    const value = getValue(config, normalized.key);

    if (options.json) {
      console.log(JSON.stringify({ key: normalized.key, value }, null, 2));
      return;
    }

    if (value === undefined) {
      console.log(chalk.dim('(unset)'));
      return;
    }

    console.log(value);
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

export async function configSet(key: string, value: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    const normalized = normalizeKey(key);
    const config = loadOrCreateGlobalConfig();
    const nextValue = normalizeValue(normalized.key, value);

    setValue(config, normalized.key, nextValue);
    saveGlobalConfig(config);

    if (options.json) {
      console.log(JSON.stringify({ key: normalized.key, value: nextValue }, null, 2));
      return;
    }

    if (normalized.alias) {
      console.log(chalk.yellow(`Note: ${normalized.alias} is deprecated. Use ${normalized.key} instead.`));
    }
    console.log(chalk.green(`Set ${normalized.key} = ${nextValue}`));
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

export async function configUnset(key: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    const normalized = normalizeKey(key);
    const config = loadOrCreateGlobalConfig();

    unsetValue(config, normalized.key);
    saveGlobalConfig(config);

    if (options.json) {
      console.log(JSON.stringify({ key: normalized.key, value: getValue(config, normalized.key) }, null, 2));
      return;
    }

    console.log(chalk.green(`Reset ${normalized.key}`));
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}

export async function configList(options: ConfigCommandOptions = {}): Promise<void> {
  try {
    const config = loadOrCreateGlobalConfig();

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    for (const key of CONFIG_KEYS) {
      const value = getValue(config, key);
      const display = value === undefined ? chalk.dim('(unset)') : value;
      console.log(`${key} = ${display}`);
    }
  } catch (error: unknown) {
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
  }
}
