---
name: skild
description: Skill package manager for AI Agents — install, manage, and publish Agent Skills.
version: 0.2.8
author: Peiiii
license: MIT
tags:
  - cli
  - package-manager
  - skills
---

# skild

**skild** is the package manager for Agent Skills — like npm, but for AI agents.

## When to Use

Use this skill when:
- Installing new capabilities for AI agents
- Managing installed Skills (list, update, uninstall)
- Publishing Skills to share with the community
- Searching or discovering new Skills

## Prerequisites

Node.js ≥18 is required.

```bash
npm install -g skild
```

## Core Commands

### Install a Skill

```bash
# From GitHub (shorthand)
skild install owner/repo/path/to/skill

# From registry
skild install @publisher/skill-name

# From local directory
skild install ./my-skill
```

### List Installed Skills

```bash
skild list
```

Output groups Skills by type: Skillsets, Skills, Dependencies.

### Manage Skills

```bash
skild info <skill>       # Show details
skild update <skill>     # Update to latest
skild uninstall <skill>  # Remove
skild validate <path>    # Validate structure
```

### Search Registry

```bash
skild search <query>
```

Browse online: [hub.skild.sh](https://hub.skild.sh)

## Target Platforms

| Platform | Option | Global Path |
|----------|--------|-------------|
| Claude | `-t claude` (default) | `~/.claude/skills` |
| Codex | `-t codex` | `~/.codex/skills` |
| Copilot | `-t copilot` | `~/.github/skills` |
| Antigravity | `-t antigravity` | `~/.gemini/antigravity/skills` |

```bash
# Example: Install to Antigravity
skild install @publisher/skill -t antigravity

# Project-level installation
skild install @publisher/skill --local
```

## Skillsets

Skillsets bundle multiple Skills for one-command installation:

```bash
skild install @skild/data-analyst-pack
# Installs: csv, pandas, sql-helper...
```

## Publishing Skills

```bash
# 1. Create account
skild signup

# 2. Login
skild login

# 3. Publish
skild publish --dir ./my-skill
```

## Command Reference

For the complete command reference with all options, see [commands.md](./commands.md).

## Skillsets

For detailed Skillsets guide (bundles of Skills), see [skillsets.md](./skillsets.md).

## Troubleshooting

For common issues and solutions, see [troubleshooting.md](./troubleshooting.md).

## More Info

- Website: [skild.sh](https://skild.sh)
- Hub: [hub.skild.sh](https://hub.skild.sh)
- Documentation: [GitHub](https://github.com/Peiiii/skild/tree/main/docs)
