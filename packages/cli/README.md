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
skild list --local

# Inspect / Validate / Update / Uninstall
skild info pdf -t codex --local
skild validate pdf -t codex --local
skild update pdf -t codex --local
skild uninstall pdf -t codex --local

# Sync installed skills across platforms
skild sync --all

# Create a new Skill
skild init my-skill

# Extract GitHub skills
skild extract-github-skills https://github.com/ComposioHQ/awesome-claude-skills
```

Full user guide (CLI + registry + console):

- `docs/usage.md`
- `docs/usage.zh-CN.md`
