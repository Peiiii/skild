# Show HN: Skild – The npm for AI agent skills

Hi HN,

I built **Skild**, an open-source CLI that simplifies how we manage, discover, and share skills for AI agents.

**The Problem:**
AI agent "skills" (tools, knowledge bases, functions) are becoming essential primitives. However, every platform (Claude Desktop, Codex, Copilot, Antigravity, etc.) has its own directory structure, file conventions, and manual installation steps. I found myself manually copying MCP-like scripts and tools into various directories across different machines. It felt like the early days of manual library management before package managers became standard.

**The Solution:**
Skild brings a unified package management workflow to agent skills. Like npm, but for the AI ecosystem.

**Key Features:**
- **Unified Workflow**: Install from GitHub URLs, shorthands, the Skild registry, or local directories.
- **Multi-platform**: Install to one specific agent or all of them (`--all`) with a single command.
- **Skillsets**: Bundle related skills into a single "pack" (e.g., a "superpowers" pack for TDD, debugging, and code review).
- **Discovery**: Built-in search and recursion to find skills within nested repo structures.

**Quick Demo:**

```bash
# GitHub URL or shorthand
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
skild install anthropics/skills/skills/pdf

# Install to all supported targets at once
skild install pdf --all

# Install a curated pack (Skillset)
skild install superpowers  # Installs 14+ skills for development

# Multi-skill repo discovery (recursively find SKILL.md)
skild install https://github.com/anthropics/skills --recursive

# Search, list, validate
skild search pdf
skild list
skild validate ./path/to/skill

# Create & publish a skill
skild init my-skill
skild publish --alias my-cool-tool
```

**Links:**
- Website: https://skild.sh
- Hub (Web UI): https://hub.skild.sh
- GitHub: https://github.com/Peiiii/skild (MIT License)

**Seeking Feedback on:**
- Does the "Skillset" (curated packs) concept resonate with your agent workflows?
- What primitives are we missing? (e.g., version pinning, lockfiles, or better discovery UX)
- How do you personally manage your agent's tools today?

I’ll be here to answer any questions!
