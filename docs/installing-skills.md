# Installing Skills

This guide covers all the ways to install and manage Skills.

---

## Install Sources

### From GitHub

The most common way to install Skills:

```bash
# Shorthand (recommended)
skild install anthropics/skills/skills/pdf

# Full URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
```

### From Local Directory

Install a Skill from your local filesystem:

```bash
skild install ./path/to/my-skill
```

### Multi-skill directories / repos (install many skills at once)

If `<source>` does not have a `SKILL.md` at its root but contains multiple Skills under subdirectories (e.g. `skills/*/SKILL.md`), `skild` can detect them.

- In a TTY, `skild install <source>` will prompt you to install all discovered Skills.
- For non-interactive usage, use `--recursive` (or `-y`) to proceed.

```bash
# Install all discovered Skills
skild install https://github.com/owner/repo/tree/main --recursive
```

### From Skild Registry

Install officially published Skills:

```bash
skild install @publisher/skill-name

# Specific version
skild install @publisher/skill-name@1.2.3
```

---

## Target Platforms

Skild supports multiple AI agent platforms:

| Platform | Option | Install Path |
|----------|--------|--------------|
| Claude | `-t claude` (default) | `~/.claude/skills` |
| Codex | `-t codex` | `~/.codex/skills` |
| OpenCode | `-t opencode` | `~/.config/opencode/skill` |
| Cursor | `-t cursor` | `~/.cursor/skills` |
| Windsurf | `-t windsurf` | `~/.windsurf/skills` |
| Copilot | `-t copilot` | `~/.github/skills` |
| Antigravity | `-t antigravity` | `~/.gemini/antigravity/skills` |

Example:

```bash
skild install anthropics/skills/skills/pdf -t codex
```

Install to all platforms:

```bash
skild install anthropics/skills/skills/pdf --all
```

---

## Global vs Project-Level

By default, Skills install globally. Use `--local` for project-level installation:

```bash
# Global (default)
skild install @publisher/skill

# Project-level (current directory)
skild install @publisher/skill --local
```

Project-level paths:
- Claude: `./.claude/skills`
- Codex: `./.codex/skills`
- OpenCode: `./.opencode/skill`
- Cursor: `./.cursor/skills`
- Windsurf: `./.windsurf/skills`
- Copilot: `./.github/skills`
- Antigravity: `./.agent/skills`

---

## Managing Skills

### List Installed Skills

```bash
skild list
```

### Install by alias (short name)

If a skill/skillset has an alias, you can install it with a short identifier:

```bash
skild install superpowers
```

### Show Skill Details

```bash
skild info skill-name
```

### Update Skills

```bash
# Update all
skild update

# Update specific
skild update skill-name
```

### Uninstall

```bash
skild uninstall skill-name
```

### Validate

```bash
skild validate skill-name
```

---

## Options Reference

| Option | Description |
|--------|-------------|
| `-t, --target <platform>` | Target platform: `claude`, `codex`, `copilot`, `antigravity`, `opencode`, `cursor`, `windsurf` |
| `--all` | Install to all platforms |
| `--recursive` | If source is multi-skill, install all discovered Skills |
| `-y, --yes` | Skip confirmation prompts (assume yes) |
| `--depth <n>` | Max directory depth to scan for `SKILL.md` (default: 6) |
| `--max-skills <n>` | Safety limit for discovered Skills to install (default: 200) |
| `--local` | Install to project directory instead of global |
| `--force` | Overwrite existing installation |
| `--json` | Output in JSON format |

---

## Searching Skills

Find Skills in the Skild registry:

```bash
skild search pdf
```

Or browse online at [hub.skild.sh](https://hub.skild.sh).
