import type { Env } from "./env.js";

function requiredEnv(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getConsolePublicUrl(env: Env): string {
  return (env.CONSOLE_PUBLIC_URL || "https://console.skild.sh").trim().replace(/\/+$/, "");
}

export function getRegistryPublicUrl(env: Env): string {
  return (env.REGISTRY_PUBLIC_URL || "https://registry.skild.sh").trim().replace(/\/+$/, "");
}

export function getEmailVerifyTtlHours(env: Env): number {
  const raw = (env.EMAIL_VERIFY_TTL_HOURS || "24").trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || n > 24 * 30) return 24;
  return n;
}

export function computeVerificationLink(env: Env, token: string): string {
  const base = getConsolePublicUrl(env);
  const url = new URL(`${base}/verify-email`);
  url.searchParams.set("token", token);
  return url.toString();
}

type MailChannelsPayload = {
  personalizations: Array<{ to: Array<{ email: string }> }>;
  from: { email: string; name?: string };
  subject: string;
  content: Array<{ type: "text/plain"; value: string }>;
};

async function sendViaMailChannels(env: Env, input: { toEmail: string; subject: string; text: string }): Promise<void> {
  const fromEmail = requiredEnv("EMAIL_FROM", env.EMAIL_FROM);
  const fromName = (env.EMAIL_FROM_NAME || "skild").trim();

  const payload: MailChannelsPayload = {
    personalizations: [{ to: [{ email: input.toEmail }] }],
    from: { email: fromEmail, name: fromName || undefined },
    subject: input.subject,
    content: [{ type: "text/plain", value: input.text }],
  };

  const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed (${res.status}): ${body}`.trim());
  }
}

export async function sendVerificationEmail(
  env: Env,
  input: { toEmail: string; handle: string; token: string },
): Promise<
  | { ok: true; mode: string; dispatched: boolean }
  | { ok: false; mode: string; dispatched: boolean; error: string }
> {
  const mode = (env.EMAIL_MODE || "mailchannels").trim().toLowerCase();
  const verificationLink = computeVerificationLink(env, input.token);
  const subject = "Verify your email for skild";
  const text = [
    `Hi @${input.handle},`,
    "",
    "Please verify your email to enable publishing Skills on skild:",
    verificationLink,
    "",
    `If you didn't request this, you can ignore this email.`,
    "",
    `Registry: ${getRegistryPublicUrl(env)}`,
  ].join("\n");

  try {
    if (mode === "log") {
      // Dev-mode: do not send email, but still produce a link in logs.
      console.log(`[skild] verify-email link for ${input.toEmail}: ${verificationLink}`);
      return { ok: true, mode, dispatched: false };
    }
    await sendViaMailChannels(env, { toEmail: input.toEmail, subject, text });
    return { ok: true, mode, dispatched: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[skild] verification email failed: ${msg}`);
    return { ok: false, mode, dispatched: false, error: msg };
  }
}
