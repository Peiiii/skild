import readline from 'readline';

export async function promptLine(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  try {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    const answer = await new Promise<string>(resolve => rl.question(`${question}${suffix}: `, resolve));
    const trimmed = answer.trim();
    return trimmed || defaultValue || '';
  } finally {
    rl.close();
  }
}

export async function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true }) as any;
  rl.stdoutMuted = true;
  rl._writeToOutput = function _writeToOutput(this: any, stringToWrite: string) {
    // Hide characters; still allow newlines/prompt to be shown.
    if (this.stdoutMuted) return;
    this.output.write(stringToWrite);
  };

  try {
    const answer = await new Promise<string>(resolve => rl.question(`${question}: `, resolve));
    return String(answer || '');
  } finally {
    rl.stdoutMuted = false;
    rl.close();
    // Ensure the next output starts on a new line.
    process.stdout.write('\n');
  }
}
