# Release

This repo is a pnpm monorepo. We use Changesets to manage versions and npm publishing.

## One-time setup (maintainers)

- `npm whoami` works (or `NPM_TOKEN` is set)
- You have a clean git working tree on `main`

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
