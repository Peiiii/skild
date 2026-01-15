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
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    // Fallback (should be rare): echoing input is better than hanging.
    return promptLine(question);
  }

  const stdin = process.stdin;
  const stdout = process.stdout;

  stdout.write(`${question}: `);

  const wasRaw = Boolean((stdin as any).isRaw);
  stdin.setRawMode(true);
  stdin.resume();
  readline.emitKeypressEvents(stdin);

  const buf: string[] = [];

  return await new Promise<string>((resolve, reject) => {
    function cleanup(): void {
      stdin.off('keypress', onKeypress);
      stdin.setRawMode(wasRaw);
      stdin.pause();
    }

    function onKeypress(str: string, key: any): void {
      if (key?.ctrl && key?.name === 'c') {
        stdout.write('\n');
        cleanup();
        const err = new Error('Prompt cancelled');
        (err as any).code = 'PROMPT_CANCELLED';
        reject(err);
        return;
      }

      if (key?.name === 'return' || key?.name === 'enter') {
        stdout.write('\n');
        cleanup();
        resolve(buf.join(''));
        return;
      }

      if (key?.name === 'backspace' || key?.name === 'delete') {
        if (buf.length) buf.pop();
        return;
      }

      if (!str) return;
      if (key?.ctrl || key?.meta) return;
      buf.push(str);
    }

    stdin.on('keypress', onKeypress);
  });
}

export async function promptConfirm(question: string, options: { defaultValue?: boolean } = {}): Promise<boolean> {
  const defaultValue = options.defaultValue ?? false;
  const suffix = defaultValue ? ' (Y/n)' : ' (y/N)';
  const answer = await promptLine(`${question}${suffix}`);
  const v = answer.trim().toLowerCase();
  if (!v) return defaultValue;
  if (v === 'y' || v === 'yes') return true;
  if (v === 'n' || v === 'no') return false;
  return defaultValue;
}
