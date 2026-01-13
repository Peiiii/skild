export class HttpError extends Error {
  readonly status: number;
  readonly bodyText: string;

  constructor(status: number, bodyText: string) {
    super(`HTTP ${status}`);
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    const credentials = init.credentials ?? 'include';
    const res = await fetch(url, { ...init, credentials, signal: controller.signal });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      parsed = null;
    }

    if (res.ok) {
      if (parsed === null) throw new HttpError(res.status, text);
      return parsed as T;
    }

    if (parsed && typeof parsed === 'object' && 'ok' in (parsed as Record<string, unknown>) && (parsed as { ok: unknown }).ok === false) {
      return parsed as T;
    }

    throw new HttpError(res.status, text);
  } finally {
    clearTimeout(timer);
  }
}
