<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*Agent Skills 的包管理器 — 轻松发现、安装、管理和发布 AI Agent Skills*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[官网](https://skild.sh) · [文档](./docs) · [示例](./examples)

**[English](./README.md)** | 简体中文

</div>

---

## 🚀 快速开始

```bash
# 安装 skild
curl -fsSL https://skild.sh/install | sh
# 或者
npm install -g skild

# 从 GitHub 安装 Skill
skild install https://github.com/anthropics/skills/tree/main/pdf

# 列出已安装的 Skills
skild list

# 创建新的 Skill
skild init my-awesome-skill

# 验证 Skill 格式
skild validate
```

## ✨ 功能特性

- **📦 一键安装** — 从任意 Git URL 安装 Skills
- **🔍 发现** — 从社区搜索和浏览 Skills
- **✅ 验证** — 确保你的 Skills 符合官方格式
- **🚀 发布** — 与全世界分享你的 Skills
- **🔄 同步** — 在 Claude Code、Claude.ai 等平台间保持同步

## 📖 什么是 Agent Skills？

[Agent Skills](https://agentskills.io) 是 Anthropic 发布的开放标准，用于为 AI Agent 扩展专业知识和工作流。Skills 是包含指令、脚本和资源的文件夹，Agent 可以动态发现并加载它们。

**skild** 让管理这些 Skills 变得简单 — 把它想象成 AI Agent 的 npm。

## 🛠️ 命令一览

| 命令 | 描述 |
|------|------|
| `skild install <url>` | 从 Git URL 安装 Skill |
| `skild install <name>` | 从注册表安装 Skill |
| `skild uninstall <skill>` | 卸载 Skill |
| `skild list` | 列出已安装的 Skills |
| `skild info <skill>` | 查看 Skill 详情 |
| `skild search <query>` | 搜索 Skills |
| `skild init <name>` | 创建新的 Skill 项目 |
| `skild validate [path]` | 验证 Skill 格式 |
| `skild publish` | 发布到注册表 |

## 📁 项目结构

```
skild/
├── packages/
│   ├── cli/                 # CLI 工具 (skild 命令)
│   ├── core/                # 核心库
│   └── web/                 # Web UI (skild.sh)
├── docs/                    # 文档
└── examples/                # 示例 Skills
```

## 🤝 参与贡献

欢迎贡献！请查看我们的[贡献指南](./CONTRIBUTING.md)了解详情。

## 📄 开源许可

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ skild.sh**

*Get your agents skilled.*

</div>
