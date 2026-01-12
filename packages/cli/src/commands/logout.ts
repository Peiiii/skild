import chalk from 'chalk';
import { clearRegistryAuth } from '@skild/core';

export async function logout(): Promise<void> {
  clearRegistryAuth();
  console.log(chalk.green('Logged out.'));
}

