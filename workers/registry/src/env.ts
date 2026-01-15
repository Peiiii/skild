export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  PBKDF2_ITERATIONS: string;
  REGISTRY_PUBLIC_URL?: string;
  CONSOLE_PUBLIC_URL?: string;
  EMAIL_MODE?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_VERIFY_TTL_HOURS?: string;
  REQUIRE_EMAIL_VERIFICATION_FOR_PUBLISH?: string;
  GITHUB_TOKEN?: string;
  ADMIN_TOKEN?: string;
  DISCOVER_MIN_STARS?: string;
}
