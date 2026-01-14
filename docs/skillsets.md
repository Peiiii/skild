# Skillsets

> **One Pack, Many Skills.**

Skillsets are a unique Skild feature that allows you to install multiple skills with a single command.

## What is a Skillset?

A **Skillset** is a curated pack of skills bundled together. Instead of installing related skills one by one, Skillsets let you:

- **Install everything at once** — `skild install @scope/data-analyst-pack`
- **Get a complete toolkit** — All dependencies are resolved automatically
- **Stay organized** — Related skills are grouped logically

## Skillset vs Skill

| Feature | Skill | Skillset |
|---------|-------|----------|
| Purpose | Single capability | Collection of capabilities |
| Dependencies | Optional | Core feature (bundles multiple skills) |
| Use case | Specific task (e.g., PDF processing) | Complete workflow (e.g., data analysis) |
| Install command | `skild install @scope/pdf` | `skild install @scope/analyst-pack` |

## Installing a Skillset

Installing a Skillset is identical to installing a regular Skill:

```bash
skild install @scope/data-analyst-pack
```

Skild will automatically install all bundled skills in the pack.

## Example Skillsets

| Skillset | Description | Includes |
|----------|-------------|----------|
| `@skild/data-analyst` | Data analysis toolkit | csv, pandas, sql-helper |
| `@skild/frontend-dev` | Frontend development | typescript, eslint, prettier |

## Creating Your Own Skillset

To create a Skillset, add `skillset: true` and `dependencies` to your `SKILL.md`:

```yaml
---
name: my-toolkit
version: 1.0.0
description: My curated skill collection
skillset: true
dependencies:
  - @anthropic/csv
  - @skild/pandas
  - ./utils/helper  # Local sub-skill
---
```

Then publish as usual:

```bash
skild publish
```

## Learn More

- [Creating Skills](./creating-skills.md)
- [Publishing Skills](./publishing-skills.md)
- [Skild Hub - Discover Skillsets](https://hub.skild.sh/skillsets)
