<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Website](https://skild.sh) · [Documentation](./docs/usage.md) · [Console](https://console.skild.sh)

English | **[简体中文](./README.zh-CN.md)**

</div>

---

## Quick Start

```bash
# Install
npm i -g skild

# Install a Skill (from GitHub)
skild install anthropics/skills/skills/pdf

# List installed Skills
skild list
```

That's it. Your agent now has the `pdf` skill.

## What is this?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents. **skild** is the package manager for these Skills — like npm, but for AI agents.

## Commands

| Command | Description |
|---------|-------------|
| `skild install <source>` | Install a Skill (Git URL / degit / local / registry) |
| `skild list` | List installed Skills |
| `skild info <skill>` | Show Skill details |
| `skild validate <path>` | Validate a Skill folder |
| `skild update [skill]` | Update installed Skills |
| `skild uninstall <skill>` | Remove a Skill |
| `skild init <name>` | Create a new Skill project |
| `skild search <query>` | Search the registry |
| `skild publish` | Publish a Skill to the registry |

Run `skild <command> --help` for full options.

## Multi-platform Support

```bash
# Claude (default)
skild install anthropics/skills/skills/pdf

# Codex CLI
skild install anthropics/skills/skills/pdf -t codex

# Project-level (instead of global)
skild install anthropics/skills/skills/pdf --local
```

## Documentation

- **[Full Usage Guide](./docs/usage.md)** — Complete reference for CLI + registry + publishing
- **[中文文档](./docs/usage.zh-CN.md)**

## License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ [skild.sh](https://skild.sh)**

</div>
