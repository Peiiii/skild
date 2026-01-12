# CLI

For the full end-to-end guide (CLI + registry + publisher console), see:

- `docs/usage.md`

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

# overwrite existing
skild install ./path/to/your-skill --force
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

## Inspect / Validate / Update / Uninstall

```bash
skild info pdf -t codex --local
skild validate pdf -t codex --local
skild update pdf -t codex --local
skild uninstall pdf -t codex --local
```

## Create a new Skill

```bash
skild init my-skill
cd my-skill
skild validate .
```
