# Show HN: Skild – a unified package manager for agent skills & skillsets

Hi HN,

I built **Skild**, an open-source CLI + registry that makes agent skills easy to discover, install, and share across different AI agent platforms. It’s already live in production.

**Why:** skills are becoming a primitive, but each platform has different install paths and conventions. Skills are scattered across GitHub repos, subfolders, curated lists, and registries. Installs are often manual and hard to reproduce.

**What Skild adds:**
- One install workflow for GitHub, shorthand, registry, or local dirs
- Install to one platform or **all** supported targets with a single command
- **Skillsets**: curated packs of skills you can install and share as one unit
- Alias installs for short names (e.g. `skild install superpowers`)
- Multi-skill repos: discover + install skills under `skills/*/SKILL.md`
- Non-interactive mode for CI (`--recursive`, `-y`)

**Examples**
```bash
# GitHub URL or shorthand
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
skild install anthropics/skills/skills/pdf

# Install to one target or all supported targets
skild install anthropics/skills/skills/pdf -t codex
skild install anthropics/skills/skills/pdf --all

# Alias install (if published)
skild install superpowers

# Multi-skill repo discovery
skild install https://github.com/anthropics/skills --recursive

# Search, list, validate
skild search pdf
skild list
skild validate ./path/to/skill

# Update or uninstall
skild update pdf
skild uninstall pdf

# Create & publish a skill
skild init my-skill
cd my-skill
skild login
skild publish --name my-skill 
skild install @yourhandle/my-skill
```

Links:
- Website: https://skild.sh
- Hub (search/browse): https://hub.skild.sh
- GitHub: https://github.com/Peiiii/skild

I’d love feedback on:
- the “skillset” concept (packs of skills)
- the ideal install/update workflow
- missing primitives (versioning, pinning, lockfiles, discovery UX)
