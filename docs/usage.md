# Usage Guide

Complete reference for **skild** — CLI, registry, and publishing.

## Quick Start

```bash
# Install skild
npm i -g skild

# Install a Skill from GitHub
skild install anthropics/skills/skills/pdf

# List installed Skills
skild list
```

Done. Your agent now has the `pdf` skill installed at `~/.claude/skills/pdf`.

---

## Installation

```bash
# npm (recommended)
npm i -g skild

# or run without installing
npx skild@latest --help
```

Requirements: Node.js ≥18

---

## Installing Skills

### From GitHub

```bash
# Full URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# Shorthand (degit style)
skild install anthropics/skills/skills/pdf
```

### Install to all platforms

```bash
skild install https://github.com/anthropics/skills/tree/main/skills/pdf --all
```

### From Local Directory

```bash
skild install ./path/to/your-skill
```

### Multi-skill sources (install many skills at once)

If `<source>` does not contain a `SKILL.md` at its root but has multiple sub-skills (e.g. `skills/*/SKILL.md`), `skild install` can detect them.

```bash
# Install all discovered sub-skills
skild install https://github.com/owner/repo/tree/main/skills --recursive

# Non-interactive: skip prompts (assume yes)
skild install ./path/to/repo-root-with-many-skills -y
```

Interactive mode:

- Prompts you to select which skills to install (default: all).
- Prints the selected skills before installing.

### From Registry

```bash
skild install @peiiii/hello-skill
skild install @peiiii/hello-skill@1.0.0
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --target` | Platform: `claude`, `codex`, `copilot`, `antigravity`, `opencode`, `cursor`, `windsurf` (interactive prompt defaults to all; non-interactive defaults to `claude`) |
| `--all` | Install to all platforms |
| `--recursive` | If source is a multi-skill directory/repo (no root `SKILL.md`), install all discovered skills |
| `-y, --yes` | Skip confirmation prompts (assume yes) |
| `--depth <n>` | Max markdown recursion depth (default: 0) |
| `--scan-depth <n>` | Max directory depth to scan for `SKILL.md` (default: 6) |
| `--max-skills <n>` | Safety limit for discovered skills to install (default: 200) |
| `--local` | Install to project directory instead of global |
| `--force` | Overwrite existing Skill |
| `--json` | Output JSON |

Interactive platform selection:

- If you omit `--target`/`--all`, you will be prompted to select platforms (default: all).

---

## Managing Skills

```bash
# List installed
skild list

# Show details
skild info pdf

# Validate structure
skild validate pdf

# Update
skild update pdf

# Remove
skild uninstall pdf
```

## Push Skills to a Git Repo

```bash
# Remote repo (default)
skild push owner/repo --dir ./path/to/skill
skild push https://github.com/owner/repo.git --dir ./path/to/skill

# Set a default repo (omit <repo> afterwards)
skild config set push.defaultRepo owner/repo
skild push --dir ./path/to/skill

# Local repo (explicit)
skild push /abs/path/to/repo --dir ./path/to/skill --local

# Customize target path / branch / commit message
skild push owner/repo --dir ./path/to/skill --path skills/demo --branch main --message "update demo skill"
```

Notes:
- Default target path: `skills/<skill-name>` (from `SKILL.md` frontmatter.name).
- Use `--local` or explicit path prefix (`./`, `/`, `~/`, `file://`) for local repositories.
- For `owner/repo`, skild tries SSH first and falls back to HTTPS if SSH auth fails.
- `skild push <repo>` always overrides the default repo.
- `SKILD_DEFAULT_PUSH_REPO` overrides the configured default repo per shell.

### Sync Skills Across Platforms

Auto-discover missing installs across platforms, then select what to sync (tree view: All → Platform → Skill):

```bash
# Auto detect missing skills and sync (default: all platforms, tree prompt in TTY)
skild sync

# Limit to specific skills or target platforms
skild sync pdf web-scraper --to codex,cursor

# Non-interactive: sync all missing items (use --force to overwrite existing)
skild sync --yes --force
```

---

## Extract GitHub Skills

```bash
skild extract-github-skills https://github.com/ComposioHQ/awesome-claude-skills
```

Options:

| Option | Description |
|--------|-------------|
| `--out <dir>` | Output directory (default: `./skild-github-skills`) |
| `--force` | Overwrite existing output directory |
| `--depth <n>` | Max markdown recursion depth (default: 0) |
| `--scan-depth <n>` | Max directory depth to scan for `SKILL.md` (default: 6) |
| `--max-skills <n>` | Max discovered skills to export (default: 200) |
| `--json` | Output JSON |

All commands accept `-t <platform>` and `--local` options.

---

## Target Platforms

| Platform | Global Path | Project Path |
|----------|-------------|--------------|
| `claude` | `~/.claude/skills` | `./.claude/skills` |
| `codex` | `~/.codex/skills` | `./.codex/skills` |
| `opencode` | `~/.config/opencode/skill` | `./.opencode/skill` |
| `cursor` | `~/.cursor/skills` | `./.cursor/skills` |
| `windsurf` | `~/.windsurf/skills` | `./.windsurf/skills` |
| `copilot` | `~/.github/skills` | `./.github/skills` |
| `antigravity` | `~/.gemini/antigravity/skills` | `./.agent/skills` |

Example:

```bash
# Install to Codex, project-level
skild install anthropics/skills/skills/pdf -t codex --local

# Alias: npm-style
skild add anthropics/skills/skills/pdf
```

---

## Creating Skills

```bash
skild init my-skill
cd my-skill
skild validate .
```

This creates a folder with `SKILL.md` template.

---

## Publishing to Registry

### 1. Create Account

```bash
skild signup
```

Or use the [Skild Hub](https://hub.skild.sh).

Email verification:

- Email verification may be required for publishing (depending on server policy).
- If email sending is disabled in local dev (`EMAIL_MODE=log`), the registry prints the verification link in the registry dev logs.

### 2. Login

```bash
skild login
skild whoami  # verify
```

### 3. Publish

Your `SKILL.md` needs frontmatter:

```md
---
name: my-skill
description: What this skill does
version: 0.1.0
---
```

Then:

```bash
skild publish --dir ./my-skill
```

Optional: set a short alias (global unique) for easy installs:

```bash
skild publish --dir ./my-skill --alias my-skill
```

If publish fails with `Email not verified` (HTTP 403), verify your email in the Skild Hub first.

---

## Registry Commands

| Command | Description |
|---------|-------------|
| `skild signup` | Create publisher account |
| `skild login` | Store credentials locally |
| `skild whoami` | Show current identity |
| `skild logout` | Remove credentials |
| `skild search <query>` | Search registry |

Default registry: `https://registry.skild.sh`

Override: `--registry <url>` or `SKILD_REGISTRY_URL` env var.

---

## Files Written by skild

| Path | Purpose |
|------|---------|
| `~/.skild/config.json` | Global config |
| `~/.skild/registry-auth.json` | Registry credentials |
| `~/.skild/lock.json` | Global lockfile |
| `./.skild/lock.json` | Project lockfile |
| `<skill>/.skild/install.json` | Install metadata |

---

## Troubleshooting

**"Command not found"**
```bash
npm i -g skild
```

**Registry timeout**
```bash
skild search pdf --registry https://registry.skild.sh
```
