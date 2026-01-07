# CLI

## Install

```bash
npm i -g skild
# or
npx skild@latest --help
```

## Install a Skill

```bash
# GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# degit shorthand
skild install anthropics/skills/skills/pdf#main

# local directory
skild install ./path/to/your-skill
```

## Target platform + install location

```bash
# Codex CLI, global (~/.codex/skills)
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex

# Codex CLI, project-level (./.codex/skills)
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local

# List installed
skild list -t codex --local
```
