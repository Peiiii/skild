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
# Install skild
npm i -g skild

# Install a Skill
skild install anthropics/skills/skills/pdf

# List installed Skills
skild list
```

That's it. Your agent now has the `pdf` skill.

## What is this?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents. **skild** is the package manager for these Skills — like npm, but for AI agents.

## Install Skills

```bash
# From GitHub (degit shorthand)
skild install anthropics/skills/skills/pdf

# From full GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# From local directory
skild install ./my-skill

# Force reinstall
skild install anthropics/skills/skills/pdf --force
```

## Multi-platform Support

Default: Claude (`~/.claude/skills`). Also supports Codex and Copilot:

```bash
# Install to Codex (global)
skild install anthropics/skills/skills/pdf -t codex

# Install to Codex (project-level)
skild install anthropics/skills/skills/pdf -t codex --local

# Install to Claude (project-level)
skild install anthropics/skills/skills/pdf --local
```

## Manage Skills

```bash
skild list                 # List installed Skills
skild info pdf             # Show Skill details
skild validate pdf         # Validate Skill structure
skild update pdf           # Update a Skill
skild uninstall pdf        # Remove a Skill
```

## Create Skills

```bash
skild init my-skill        # Create a new Skill project
cd my-skill
skild validate .           # Validate before publishing
skild publish              # Publish to registry
```

## All Commands

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

## Documentation

- **[Usage Guide](./docs/usage.md)** — CLI commands and options
- **[Console Guide](./docs/console.md)** — Web interface walkthrough
- **[Linked Skills](./docs/linked-skills.md)** — Catalog and GitHub Skills
- **[Creating Skills](./docs/creating-skills.md)** — Build your own Skills
- **[FAQ](./docs/faq.md)** — Common questions
- **[中文文档](./docs/usage.zh-CN.md)**

## License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ [skild.sh](https://skild.sh)**

</div>
