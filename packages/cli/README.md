# skild

The npm for Agent Skills — discover, install, manage, and publish AI Agent Skills with ease.

## Install

```bash
npm i -g skild
```

## Usage

```bash
skild --help

# Install a skill (Git URL / degit shorthand / local dir)
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
skild install anthropics/skills/skills/pdf#main
skild install ./path/to/your-skill

# Target platform + project-level install
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local

# List installed skills
skild list -t codex --local
```
