# NPM Package Release Process

Scope: publish npm packages in `packages/*` only (`@skild/core`, `skild`).
This does NOT cover registry/console deployment.

## Prereqs
- npm auth available via one of:
  - `.npmrc.publish.local` (preferred, ignored by git)
  - `NPM_TOKEN` env var
  - `npm login` (interactive)
- Changeset config ignores non-published workspaces (apps/workers)

## Standard flow
1) Create changeset
```bash
pnpm changeset
```

2) Bump versions + changelogs
```bash
pnpm release:version
```

3) Publish
```bash
pnpm release:publish
```

Notes:
- `release:publish` runs `pnpm release:check` (build + lint + typecheck) before publishing.
- `release:publish` uses `changeset publish` and creates git tags automatically.
- Unrelated files (e.g., `apps/*`) are not part of npm publish; no need to revert them.
- If `pnpm changeset` lists unexpected packages, update `.changeset/config.json` `ignore` list.

## Troubleshooting
- Auth error: create `.npmrc.publish.local` with an npm automation token or set `NPM_TOKEN`.
- 2FA: use `pnpm release -- --otp=123456` if required.
- If publish fails due to git checks, keep using `release:publish` (it handles auth and is the supported path).
