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

These are curated packs you can install by alias (short name):

| Alias | Registry Skillset | Description |
|-------|-------------------|-------------|
| `superpowers` | `@peiiii/obra-superpowers-pack` | Planning, debugging, TDD, code review, verification |
| `anthropics-skills` | `@peiiii/anthropics-official-pack` | All official Claude skills from `anthropics/skills` |
| `claude-office` | `@peiiii/claude-office-pack` | PDF/Word/PPT/Excel + internal comms |
| `claude-design` | `@peiiii/claude-design-pack` | UI/UX, themes, brand, generative art |
| `claude-dev` | `@peiiii/claude-dev-pack` | Dev/testing toolkit (official + community) |
| `claude-content` | `@peiiii/claude-content-pack` | Research + writing + insights |

Install by alias:

```bash
skild install claude-dev
```

## Creating Your Own Skillset

To create a Skillset, add `skillset: true` and `dependencies` to your `SKILL.md`:

```yaml
---
name: my-toolkit
version: 1.0.0
description: My curated skill collection
skillset: true
dependencies:
  - anthropics/skills/skills/pdf
  - lackeyjb/playwright-skill/skills/playwright-skill
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
