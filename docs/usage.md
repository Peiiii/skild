# Usage

This is the end-to-end user guide for **skild** (CLI + registry + publisher console).

## Install skild

```bash
npm i -g skild
# or (no install)
npx skild@latest --help
```

Optional (macOS/Linux): install from the website script:

```bash
curl -fsSL https://skild.sh/install | sh
```

Requirements: Node.js `>=18`.

## Concepts

- **Skill**: a folder containing `SKILL.md` (plus optional scripts/resources).
- **Target platform**: where the Skill is installed to:
  - `claude` → `~/.claude/skills` or `./.claude/skills`
  - `codex` → `~/.codex/skills` or `./.codex/skills`
  - `copilot` → `~/.github/skills` or `./.github/skills`
- **Scope**: `global` (default) vs `project` (`--local`)
- **Registry identity**: `@publisher/skill[@version|tag]` (example: `@peiiii/pdf@latest`)

## Common workflows (local-first)

### Install from GitHub / local directory

```bash
# GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# Local directory
skild install ./path/to/your-skill

# Target platform + project-level install
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local
```

### List / info / validate

```bash
skild list
skild info pdf -t codex --local
skild validate pdf -t codex --local
```

### Update / uninstall

```bash
skild update
skild update pdf -t codex --local
skild uninstall pdf -t codex --local
```

### Create a new Skill project

```bash
skild init my-skill
cd my-skill
skild validate .
```

## Registry workflows (search + publish)

### Default registry

By default, skild uses:

- `https://registry.skild.sh`

Overrides:

- CLI flag: `--registry <url>` (for registry-related commands)
- Environment: `SKILD_REGISTRY_URL`

### Signup (create a publisher account)

Recommended: use the **Publisher Console** (web) for signup and token management.

CLI (headless):

```bash
skild signup
```

Email verification:

- Publishing requires a verified email.
- After signup, check your inbox for a verification email (Console also provides a resend flow).

### Login / whoami / logout

Login stores a token locally at:

- `~/.skild/registry-auth.json`

```bash
skild login
skild whoami
skild logout
```

### Search Skills

```bash
skild search pdf
```

### Install from registry

If the install source looks like `@publisher/skill`, skild installs from the registry:

```bash
skild install @peiiii/hello-skill
skild install @peiiii/hello-skill@latest
skild install @peiiii/hello-skill@1.2.3

# Optional: target + project-level
skild install @peiiii/hello-skill -t codex --local
```

### Publish to registry

1) Ensure your Skill folder has a valid `SKILL.md` frontmatter:

```md
---
name: hello-skill
description: ...
version: 0.1.0
---
```

2) Login, then publish:

```bash
skild login
skild publish --dir ./path/to/skill
```

Notes:

- `--skill-version` overrides the version (we don’t use `--version` because it conflicts with the CLI’s own `--version`).
- If your `name` is unscoped (like `hello-skill`), `skild publish` will infer your scope from the registry and publish as `@<your-handle>/hello-skill`.
- If publish fails with `Email not verified` (HTTP 403), verify your email in the Publisher Console (`/verify-email`) first.

## Publisher Console (web)

The Console is a minimal web UI for:

- Signup
- Email verification (required for publish)
- Creating access tokens (shown once)
- Searching and viewing Skill details
- Publish instructions

If you have a custom domain configured, it should look like:

- `https://console.skild.sh`

## Files written by skild

- Global config: `~/.skild/config.json`
- Registry auth: `~/.skild/registry-auth.json`
- Global lock: `~/.skild/lock.json`
- Project lock: `./.skild/lock.json`
- Install metadata per Skill: `<skill-dir>/.skild/install.json`

## Troubleshooting

- **“skild login does not exist”**: make sure you’re on a recent version:
  - `npm view skild@latest version`
  - `npx skild@latest -- --help` should list `login`.
- **Registry unreachable / hanging**: registry requests have timeouts; try rerunning with:
  - `--registry https://registry.skild.sh`
  - or set `SKILD_REGISTRY_URL`.
