<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Website](https://skild.sh) · [Documentation](./docs) · [Examples](./examples)

</div>

---

## 🚀 Quick Start

```bash
# Install skild
curl -fsSL https://skild.sh/install | sh
# or
npm install -g skild

# Install a Skill from GitHub
skild install https://github.com/anthropics/skills/tree/main/pdf

# List installed Skills
skild list

# Create a new Skill
skild init my-awesome-skill

# Validate your Skill
skild validate
```

## ✨ Features

- **📦 One-command install** — Install Skills from any Git URL
- **🔍 Discover** — Search and browse Skills from the community
- **✅ Validate** — Ensure your Skills follow the official format
- **🚀 Publish** — Share your Skills with the world
- **🔄 Sync** — Keep Skills in sync across Claude Code, Claude.ai, and more

## 📖 What are Agent Skills?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents with specialized knowledge and workflows. Skills are organized folders containing instructions, scripts, and resources that agents can dynamically discover and load.

**skild** makes it easy to manage these Skills — think of it as npm for AI agents.

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `skild install <url>` | Install a Skill from Git URL |
| `skild install <name>` | Install a Skill from registry |
| `skild uninstall <skill>` | Uninstall a Skill |
| `skild list` | List installed Skills |
| `skild info <skill>` | View Skill details |
| `skild search <query>` | Search for Skills |
| `skild init <name>` | Create a new Skill project |
| `skild validate [path]` | Validate Skill format |
| `skild publish` | Publish to registry |

## 📁 Project Structure

```
skild/
├── packages/
│   ├── cli/                 # CLI tool (skild command)
│   ├── core/                # Core library
│   └── web/                 # Web UI (skild.sh)
├── docs/                    # Documentation
└── examples/                # Example Skills
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ skild.sh**

*Get your agents skilled.*

</div>
