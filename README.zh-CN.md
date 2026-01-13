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
npm i -g skild

# 安装一个 Skill
skild install anthropics/skills/skills/pdf

# 列出已安装的 Skills
skild list
```

搞定！你的 Agent 现在拥有了 `pdf` 技能。

## 📖 什么是 Agent Skills？

[Agent Skills](https://agentskills.io) 是 Anthropic 发布的开放标准，用于为 AI Agent 扩展专业知识和工作流。**skild** 是这些 Skills 的包管理器 — 可以理解为 AI Agent 的 npm。

## 📦 安装 Skills

```bash
# 从 GitHub 安装（degit 简写）
skild install anthropics/skills/skills/pdf

# 从完整 GitHub URL 安装
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 从本地目录安装
skild install ./my-skill

# 强制重新安装
skild install anthropics/skills/skills/pdf --force
```

## 🎯 多平台支持

默认安装到 Claude（`~/.claude/skills`），也支持 Codex 和 Copilot：

```bash
# 安装到 Codex（全局）
skild install anthropics/skills/skills/pdf -t codex

# 安装到 Codex（项目级别）
skild install anthropics/skills/skills/pdf -t codex --local

# 安装到 Claude（项目级别）
skild install anthropics/skills/skills/pdf --local
```

## 🔧 管理 Skills

```bash
skild list                 # 列出已安装的 Skills
skild info pdf             # 查看 Skill 详情
skild validate pdf         # 校验 Skill 结构
skild update pdf           # 更新 Skill
skild uninstall pdf        # 卸载 Skill
```

## ✨ 创建 Skills

```bash
skild init my-skill        # 创建新的 Skill 项目
cd my-skill
skild validate .           # 发布前校验
skild publish              # 发布到 registry
```

## 🛠️ 所有命令

| 命令 | 描述 |
|------|------|
| `skild install <source>` | 安装 Skill（Git URL / degit 简写 / 本地目录） |
| `skild list` | 列出已安装的 Skills |
| `skild info <skill>` | 查看已安装 Skill 详情 |
| `skild validate [path|skill]` | 校验 Skill 目录或已安装 Skill |
| `skild uninstall <skill>` | 卸载 Skill |
| `skild update [skill]` | 更新单个或全部已安装 Skill |
| `skild init <name>` | 创建新的 Skill 项目 |
| `skild signup` | 创建 registry 发布者账号 |
| `skild login` | 登录 registry（把 token 保存到本地） |
| `skild whoami` | 查看当前 registry 身份 |
| `skild logout` | 清除本地登录信息 |
| `skild search <query>` | 在 registry 搜索 Skills |
| `skild publish` | 发布 Skill 目录到 registry |

提示：可以用 `skild <命令> --help` 查看完整参数。

## 📚 文档

- **[完整使用指南](./docs/usage.zh-CN.md)** — CLI + registry + 发布完整参考
- **[English Docs](./docs/usage.md)**

## 🧑‍💻 本地开发

```bash
pnpm i
pnpm build:cli
pnpm cli --help
pnpm cli install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local
pnpm cli list -t codex --local
pnpm cli info pdf -t codex --local
pnpm cli validate pdf -t codex --local
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
pnpm release
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
