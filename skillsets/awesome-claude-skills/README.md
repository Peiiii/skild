# Skillsets based on VoltAgent/awesome-claude-skills

This folder contains curated **Skillsets** (skill packs) whose dependencies reference the upstream skills listed in:

- https://github.com/VoltAgent/awesome-claude-skills

## Included packs

- `claude-office-pack`: doc creation + comms
- `claude-design-pack`: creative + design
- `claude-dev-pack`: development + debugging + review workflow
- `claude-superpowers-pack`: planning + multi-agent workflow
- `claude-n8n-pack`: n8n automation

## Install locally (GitHub)

From this repo:

```bash
skild install ./skillsets/awesome-claude-skills/claude-dev-pack
```

## Publish to Skild registry

Prereq: `skild login` to the target registry.

Example:

```bash
skild publish --dir ./skillsets/awesome-claude-skills/claude-dev-pack
```

Repeat for other packs as needed.

