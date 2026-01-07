# Release

This repo is a pnpm monorepo. We use Changesets to manage versions and npm publishing.

## One-time setup (maintainers)

- Recommended: create an npm **Automation Token** and export it as `NPM_TOKEN` (non-interactive, no OTP prompt)
- Alternative: `npm whoami` works (via `npm login --auth-type=web`)
- You have a clean git working tree on `main`

## 2FA / OTP (why you may be prompted)

If your npm account has 2FA enabled for **publishing** ("Authorization and writes"), npm will require an OTP for `npm publish` (and therefore `changeset publish`).

Options:

- Recommended (local + CI): use an **Automation Token** via `NPM_TOKEN` (no OTP prompt).
- If you do have an authenticator OTP: `pnpm release -- --otp=123456` (also works for `pnpm changeset publish --otp=...`).

## Token setup (recommended)

1) Create an **Automation Token** on npm (website).
2) Export it in your shell:

```bash
export NPM_TOKEN="…"
```

3) Publish:

```bash
pnpm release
```

Notes:

- Do not commit tokens. This repo reads the token from the environment (`NPM_TOKEN`) and routes it to npm via `.npmrc.publish`.
- If you accidentally shared a token, revoke it on npm and create a new one.

## Day-to-day workflow

### 1) Create a changeset

Run:

```bash
pnpm changeset
```

This creates a file under `.changeset/*.md` describing what changed and which packages should bump.

If you prefer not to use the interactive prompt, you can create a changeset file manually under `.changeset/`.

### 2) Bump versions + changelogs

```bash
pnpm release:version
```

Commit the result.

### 3) Publish to npm

```bash
pnpm release
```

### Dry run (no publish)

```bash
pnpm release:dry
```
