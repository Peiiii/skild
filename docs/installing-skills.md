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
| Copilot | `-t copilot` | `~/.github/skills` |

Example:

```bash
skild install anthropics/skills/skills/pdf -t codex
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
- Copilot: `./.github/skills`

---

## Managing Skills

### List Installed Skills

```bash
skild list
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
| `-t, --target <platform>` | Target platform: `claude`, `codex`, `copilot` |
| `--local` | Install to project directory instead of global |
| `--force` | Overwrite existing installation |
| `--json` | Output in JSON format |

---

## Searching Skills

Find Skills in the Skild registry:

```bash
skild search pdf
```

Or browse online at [console.skild.sh](https://console.skild.sh).
