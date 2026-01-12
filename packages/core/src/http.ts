import { SkildError } from './errors.js';

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10_000
): Promise<Response> {
  const ms = Math.max(1, timeoutMs);
  const controller = new AbortController();
  const existingSignal = init.signal;

  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } catch (error: unknown) {
    // If an upstream signal aborted, prefer surfacing that as-is.
    if (existingSignal?.aborted) throw error;

    // Node fetch throws `AbortError` (DOMException) on abort.
    const name = error instanceof Error ? error.name : '';
    if (name === 'AbortError') {
      throw new SkildError('NETWORK_TIMEOUT', `Request timed out after ${ms}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

