<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Website](https://skild.sh) · [Documentation](./docs) · [Examples](./examples)

English | **[简体中文](./README.zh-CN.md)**

</div>

---

## 🚀 Quick Start

```bash
# Install skild
curl -fsSL https://skild.sh/install | sh
# or
npm install -g skild
# or (no install)
npx skild@latest --help

# Install a Skill from GitHub
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# List installed Skills
skild list
```

## ✨ Features

- **📦 One-command install** — Install Skills from any Git URL
- **🔍 Discover** — Search and browse Skills from the community
- **✅ Validate** — Ensure your Skills follow the official format
- **🚀 Publish** — Share your Skills with the world
- **🔄 Sync** — Keep Skills in sync across Claude Code, Claude.ai, and more

## 📖 What are Agent Skills?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents with specialized knowledge and workflows. Skills are organized folders containing instructions, scripts, and resources that agents can dynamically discover and load.

**skild** makes it easy to manage these Skills — think of it as npm for AI agents.

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `skild install <source>` | Install a Skill from Git URL / degit shorthand / local dir |
| `skild list` | List installed Skills |

Planned (not implemented yet): `uninstall`, `info`, `search`, `init`, `validate`, `publish`.

## 🎯 Where Skills are installed

- Claude: `~/.claude/skills` (global) or `./.claude/skills` (project)
- Codex CLI: `~/.codex/skills` (global) or `./.codex/skills` (project)
- GitHub Copilot: `~/.github/skills` (global) or `./.github/skills` (project)

Examples:

```bash
# Install into Codex (global)
skild install https://github.com/anthropics/skills/tree/main/pdf -t codex

# Install into this repo only (project-level)
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local

# List installed skills
skild list -t codex --local
```

## 🧑‍💻 Using skild while developing this repo

```bash
pnpm i
pnpm build:cli
pnpm cli --help
pnpm cli install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local
pnpm cli list -t codex --local
```

## 📁 Project Structure

```
skild/
├── packages/
│   ├── cli/                 # CLI tool (skild command)
│   └── ...                  # More packages (WIP)
├── apps/
│   └── web/                 # Web UI (skild.sh)
├── docs/                    # Documentation
└── examples/                # Example Skills
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 🚢 Releasing (Maintainers)

```bash
pnpm release:cli
```

Prereqs:
- `npm` is logged in (or `NPM_TOKEN` is set)
- `git` is on `main` with a clean working tree
- For GitHub Releases: `GITHUB_TOKEN` (or `GH_TOKEN`)

## 📄 License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ skild.sh**

*Get your agents skilled.*

</div>
