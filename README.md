<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Website](https://skild.sh) · [Documentation](./docs/README.md) · [Skild Hub](https://hub.skild.sh)

English | **[简体中文](./README.zh-CN.md)**

</div>

---

## 🚀 Quick Start

```bash
# Install skild
npm i -g skild

# Install a Skill
skild install anthropics/skills/skills/pdf

# List installed Skills
skild list
```

That's it. Your agent now has the `pdf` skill.

## 📖 What is this?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents. **skild** is the package manager for these Skills — like npm, but for AI agents.

## 📦 Install Skills

```bash
# From GitHub (degit shorthand)
skild install anthropics/skills/skills/pdf

# From full GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# From local directory
skild install ./my-skill

# From registry
skild install @publisher/skill-name

# Force reinstall
skild install anthropics/skills/skills/pdf --force
```

## 🎁 Skillsets: One Pack, Many Skills

Skillsets bundle multiple skills together — install a complete toolkit with one command:

```bash
# Install a data analyst toolkit (includes csv, pandas, sql-helper...)
skild install @skild/data-analyst-pack

# All bundled skills are automatically installed
skild list
```

See **[Skillsets Guide](./docs/skillsets.md)** for more.

## 🎯 Multi-platform Support

Default: Claude (`~/.claude/skills`). Also supports Codex, Copilot, Antigravity, OpenCode, Cursor, Windsurf:

```bash
# Install to Codex (global)
skild install anthropics/skills/skills/pdf -t codex

# Install to OpenCode (global)
skild install anthropics/skills/skills/pdf -t opencode

# Install to Cursor (global)
skild install anthropics/skills/skills/pdf -t cursor

# Install to Windsurf (global)
skild install anthropics/skills/skills/pdf -t windsurf

# Install to Codex (project-level)
skild install anthropics/skills/skills/pdf -t codex --local

# Install to Antigravity (project-level, ./.agent/skills)
skild install anthropics/skills/skills/pdf -t antigravity --local

# Install to OpenCode (project-level, ./.opencode/skill)
skild install anthropics/skills/skills/pdf -t opencode --local

# Install to Cursor (project-level, ./.cursor/skills)
skild install anthropics/skills/skills/pdf -t cursor --local

# Install to Windsurf (project-level, ./.windsurf/skills)
skild install anthropics/skills/skills/pdf -t windsurf --local
```

## 🔧 Manage Skills

```bash
skild list                 # List installed Skills
skild info pdf             # Show Skill details
skild validate pdf         # Validate Skill structure
skild update pdf           # Update a Skill
skild uninstall pdf        # Remove a Skill
```

## ✨ Create Skills

```bash
skild init my-skill        # Create a new Skill project
cd my-skill
skild validate .           # Validate structure
```

Ready to share? See **[Publishing Skills](./docs/publishing-skills.md)** for the complete guide.

## 🛠️ All Commands

| Command | Description |
|---------|-------------|
| `skild install <source>` | Install a Skill (Git URL / degit / local / registry) |
| `skild list` | List installed Skills |
| `skild info <skill>` | Show Skill details |
| `skild validate <path>` | Validate a Skill folder |
| `skild update [skill]` | Update installed Skills |
| `skild uninstall <skill>` | Remove a Skill |
| `skild init <name>` | Create a new Skill project |
| `skild search <query>` | Search the registry |
| `skild signup` | Create a publisher account |
| `skild login` | Login to registry |
| `skild whoami` | Show current identity |
| `skild logout` | Remove credentials |
| `skild publish` | Publish a Skill to the registry |
| `skild extract-github-skills <source>` | Extract GitHub Skills into a local catalog |

Run `skild <command> --help` for full options.

## 📚 Documentation

- **[Quick Start](./docs/getting-started.md)** — Get up and running in 2 minutes
- **[Installing Skills](./docs/installing-skills.md)** — All ways to install Skills
- **[Skillsets](./docs/skillsets.md)** — Install multiple Skills with one command
- **[Creating Skills](./docs/creating-skills.md)** — Build your own Skills
- **[Publishing Skills](./docs/publishing-skills.md)** — Share with the community
- **[Submit from GitHub](./docs/submit-from-github.md)** — Index GitHub Skills
- **[Skild Hub Guide](./docs/hub.md)** — Web interface walkthrough
- **[FAQ](./docs/faq.md)** — Common questions

## ⭐ Star History

<a href="https://star-history.com/#peiiii/skild&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=peiiii/skild&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=peiiii/skild&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=peiiii/skild&type=Date" />
 </picture>
</a>

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ [skild.sh](https://skild.sh)**

*Get your agents skilled.*

</div>
