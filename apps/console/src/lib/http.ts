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
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, text);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

