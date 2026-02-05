# 🛡️ skild

[![npm version](https://img.shields.io/npm/v/skild.svg?style=flat-square)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/npm/l/skild.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **The npm for AI Agent Skills** — Discover, install, manage, and publish skills for Claude, Codex, Windsurf, OpenCode, Copilot & Antigravity.

## ⚡ Quick Start

### 1. Install the CLI

```bash
npm install -g skild
```

### 2. Equip any skill

```bash
# From GitHub
skild install [username]/[repo]

# From Registry
skild install @[publisher]/[skill]

# By Alias
skild install [alias]
```

### 3. Done

```bash
# View installed skills
skild list
```

Your agent is now equipped with new capabilities!

> 💡 **Tip**: Use `--all` to install to all platforms at once, or `-t windsurf` to target a specific platform.

## ✨ Features

- **Multi-Platform** — Works with Claude, Codex, Windsurf, OpenCode, Copilot, and Antigravity
- **Multiple Sources** — Install from GitHub, the Skild Registry, or local directories
- **Skillsets** — Install bundles of related skills with one command
- **Sync** — Keep skills synchronized across all your platforms
- **Push** — Upload or update skills in a Git repository
- **Publish** — Share your skills with the community via the registry

## 📦 Installation

```bash
# npm
npm i -g skild

# pnpm
pnpm add -g skild

# yarn
yarn global add skild

# Or run without installing
npx skild@latest --help
```

Requires **Node.js ≥18**.

## 🚀 Commands

| Command | Description |
|---------|-------------|
| `skild install <source>` | Install from GitHub, Registry, or local path |
| `skild list` | Show installed skills |
| `skild info <skill>` | Display skill details |
| `skild update <skill>` | Update a skill |
| `skild uninstall <skill>` | Remove a skill |
| `skild sync` | Sync skills across platforms |
| `skild search <query>` | Search the registry |
| `skild init <name>` | Create a new skill |
| `skild publish` | Publish to the registry |
| `skild push <repo>` | Push a skill to a Git repository |

## 📥 Installing Skills

### From GitHub

```bash
# Full URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# Shorthand (degit style)
skild install anthropics/skills/skills/pdf
```

### From Registry

```bash
skild install @peiiii/pdf
skild install @peiiii/pdf@1.0.0
```

### From Local

```bash
skild install ./path/to/my-skill
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform (default: interactive prompt) |
| `--all` | Install to all platforms |
| `--skill <path-or-name>` | Pick a single skill when the source repo/folder contains multiple skills |
| `--local` | Install to project directory instead of global |
| `--force` | Overwrite existing skill |
| `-y, --yes` | Skip confirmation prompts |

## 🔄 Update / Uninstall

If you do not pass `--target`, `skild update` and `skild uninstall` will prompt you to select target platforms (default: all). You can also choose scope:

| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform |
| `-l, --local` | Target project-level scope |
| `-g, --global` | Target global scope |

## 🎯 Supported Platforms

| Platform | Global Path |
|----------|-------------|
| Claude | `~/.claude/skills` |
| Codex | `~/.codex/skills` |
| Windsurf | `~/.windsurf/skills` |
| OpenCode | `~/.config/opencode/skill` |
| Copilot | `~/.github/skills` |
| Antigravity | `~/.gemini/antigravity/skills` |
| Agents | `~/.agents/skills` |

## 🔄 Syncing Skills

Auto-detect missing skills across platforms and sync them:

```bash
# Interactive mode
skild sync

# Sync specific skills to specific platforms
skild sync pdf web-scraper --to codex,windsurf
```

## 📤 Publishing

```bash
# Create an account
skild signup

# Login
skild login

# Publish your skill
skild publish --dir ./my-skill
```

## 📚 Resources

- **[Skild Hub](https://hub.skild.sh)** — Browse and discover skills
- **[Full Documentation](https://github.com/Peiiii/skild/tree/main/docs)** — Complete usage guide
- **[GitHub](https://github.com/Peiiii/skild)** — Source code and issues

## 📄 License

MIT © [Skild](https://skild.sh)
