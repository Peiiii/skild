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
  rl.stdoutMuted = false;
  const prompt = `${question}: `;
  rl._writeToOutput = function _writeToOutput(this: any, stringToWrite: string) {
    if (this.stdoutMuted) {
      // Keep line breaks working; hide everything else (typed chars).
      if (stringToWrite === '\n' || stringToWrite === '\r\n') this.output.write(stringToWrite);
      return;
    }
    this.output.write(stringToWrite);
  };

  try {
    const answerPromise = new Promise<string>(resolve => rl.question(prompt, resolve));
    // Mute after the prompt is printed so the prompt text stays visible.
    rl.stdoutMuted = true;
    const answer = await answerPromise;
    return String(answer || '');
  } finally {
    rl.stdoutMuted = false;
    rl.close();
  }
}
