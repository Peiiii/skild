import type { Context } from "hono";
import type { Env } from "./env.js";

export function requireAdmin(c: Context<{ Bindings: Env }>): void {
  const token = (c.env.ADMIN_TOKEN || "").trim();
  const header = (c.req.header("x-admin-token") || "").trim();
  if (!token || header !== token) {
    c.status(401);
    throw new Error("Unauthorized");
  }
}
