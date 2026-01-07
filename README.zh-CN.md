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
# 或者（免安装）
npx skild@latest --help

# 从 GitHub 安装 Skill
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 列出已安装的 Skills
skild list
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
| `skild install <source>` | 从 Git URL / degit 简写 / 本地目录安装 Skill |
| `skild list` | 列出已安装的 Skills |

计划中（暂未实现）：`uninstall`、`info`、`search`、`init`、`validate`、`publish`。

## 🎯 Skills 会安装到哪里

- Claude：`~/.claude/skills`（全局）或 `./.claude/skills`（项目级）
- Codex CLI：`~/.codex/skills`（全局）或 `./.codex/skills`（项目级）
- GitHub Copilot：`~/.github/skills`（全局）或 `./.github/skills`（项目级）

示例：

```bash
# 安装到 Codex（全局）
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex

# 只安装到当前项目（项目级）
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local

# 查看已安装
skild list -t codex --local
```

## 🧑‍💻 在本仓库开发时如何使用 skild

```bash
pnpm i
pnpm build:cli
pnpm cli --help
pnpm cli install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local
pnpm cli list -t codex --local
```

## 📁 项目结构

```
skild/
├── packages/
│   ├── cli/                 # CLI 工具 (skild 命令)
│   └── ...                  # 更多 packages（开发中）
├── apps/
│   └── web/                 # Web UI (skild.sh)
├── docs/                    # 文档
└── examples/                # 示例 Skills
```

## 🤝 参与贡献

欢迎贡献！请查看我们的[贡献指南](./CONTRIBUTING.md)了解详情。

## 🚢 发布（维护者）

```bash
pnpm release:cli
```

前置条件：
- `npm` 已登录（或设置了 `NPM_TOKEN`）
- `git` 在 `main` 分支且工作区干净
- 如需创建 GitHub Release：`GITHUB_TOKEN`（或 `GH_TOKEN`）

## 📄 开源许可

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ skild.sh**

*Get your agents skilled.*

</div>
