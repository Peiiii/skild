# Skillsets Guide

Skillsets are curated packs that bundle multiple Skills together.

## What is a Skillset?

A **Skillset** is a Skill with `skillset: true` that declares dependencies on other Skills. When you install a Skillset, all its dependencies are automatically installed.

## Installing Skillsets

```bash
# Install a Skillset (same syntax as regular Skills)
skild install @scope/data-analyst-pack

# All bundled skills are installed automatically
skild list
```

## Creating Skillsets

Create a `SKILL.md` with `skillset: true` and `dependencies`:

```yaml
---
name: my-toolkit
description: My curated skill collection
version: 1.0.0
skillset: true
dependencies:
  - @anthropic/csv
  - @skild/pandas
  - ./utils/helper           # Inline (bundled) dependency
  - owner/repo/path/to/skill # GitHub shorthand
  - https://github.com/...   # Full GitHub URL
---

# My Toolkit

This Skillset bundles skills for data analysis.
```

## Dependency Types

| Type | Format | Installation |
|------|--------|--------------|
| Registry | `@scope/skill` | Installed to top-level |
| GitHub | `owner/repo/path` or full URL | Installed to top-level |
| Inline | `./relative/path` | Kept inside Skillset directory |

## Managing Skillsets

```bash
# List (shows Skillsets separately)
skild list

# Uninstall with dependencies
skild uninstall my-skillset --with-deps
```

## Example Skillsets

| Skillset | Description |
|----------|-------------|
| `@skild/data-analyst` | csv, pandas, sql-helper |
| `obra-superpowers-pack` | All obra/superpowers skills |
