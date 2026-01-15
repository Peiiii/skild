# Skild: Unified package manager for Agent Skills & Skillsets (Claude/Codex/Copilot/Antigravity/...)

Skild is an open-source CLI + registry that makes agent skills easy to discover, install, and share across different AI agent platforms.

GitHub: https://github.com/Peiiii/skild  
Website: https://skild.sh  
Hub (search/browse): https://hub.skild.sh  

---

## The Problem

Skills are becoming a common primitive across AI agents and IDEs, but the ecosystem is fragmented:

- Each platform uses different install paths and conventions.
- Skills live in many places (GitHub repos, subdirectories, curated lists, registries).
- “Install” is often manual copy/paste, hard to reproduce, and messy to maintain over time.

Skild standardizes this into a single workflow you can script, share, and repeat.

---

## What Skild Does

### 1) Install from GitHub, shorthand, registry, or local dirs

```bash
# GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# Shorthand (degit style)
skild install anthropics/skills/skills/pdf

# Registry
skild install @publisher/skill

# Local directory
skild install ./path/to/skill
```

### 2) Install to multiple platforms (and keep it consistent)

Skild supports:

- Claude: `~/.claude/skills`
- Codex: `~/.codex/skills`
- Copilot: `~/.github/skills`
- Antigravity: project `./.agent/skills` or global `~/.gemini/antigravity/skills`

Install to one target:

```bash
skild install anthropics/skills/skills/pdf -t codex
```

Install to all supported platforms:

```bash
skild install anthropics/skills/skills/pdf --all
```

### 3) Quick installs with alias

If a skill/skillset is published with a global-unique alias, users can install by a short identifier:

```bash
skild install superpowers
```

This removes the need to remember `@publisher/name` or long URLs.

### 4) Multi-skill repositories: discover + install in one shot

Many repos contain multiple skills under `skills/*/SKILL.md` (e.g. `anthropics/skills`).

Skild can install the repo root, discover all skills, and ask for confirmation:

```bash
skild install https://github.com/anthropics/skills
```

Non-interactive (CI/scripts):

```bash
skild install https://github.com/anthropics/skills --recursive
# or skip prompts (assume yes)
skild install https://github.com/anthropics/skills -y
```

### 5) Skillsets: compose and ship collections

A “skillset” is a skill that declares dependencies, allowing you to ship a curated pack of skills with one install.

This is ideal for:

- team standards (“our default agent toolbox”)
- role-based packs (frontend, SRE, PM, design)
- curated public lists

---

## Getting Started

Install:

```bash
npm i -g skild
```

Try it:

```bash
skild install anthropics/skills/skills/pdf
skild list
```

Or run without installing:

```bash
npx skild@latest --help
```

---

## Why This Matters

Once skills become part of everyday work, “installation and lifecycle” becomes an engineering problem:

- reproducibility (what did we install? where? which version?)
- safe updates and clean uninstalls
- sharing and standardizing across teammates
- automation (CI bootstrap, repo templates, onboarding scripts)

Skild is designed to make these workflows as boring and reliable as installing a package.

---

## Feedback / Collaboration

If you build skills, maintain a skill collection, or want to standardize skills across a team, I’d love to hear:

- which platforms matter most for you
- what a “perfect install experience” looks like
- any missing primitives (versioning, pinning, lockfiles, discovery UX, etc.)

GitHub: https://github.com/Peiiii/skild
