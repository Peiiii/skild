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

# 从 registry 通过名字安装
skild install @peiiii/hello-skill

# 列出已安装的 Skills
skild list
```

完整使用文档：

- `docs/usage.zh-CN.md`
- `docs/usage.md`

## ✨ 功能特性

- **📦 安装** — 支持 Git URL / degit / 本地目录安装 Skills
- **✅ 校验** — 本地验证 Skill 格式
- **🧾 元数据 + 锁文件** — 记录 source/目标/内容 hash
- **🔄 更新** — 安全更新已安装 Skills（原子替换）
- **🧹 卸载** — 干净卸载 Skills

- **🔎 搜索** — 在 registry 里搜索 Skills
- **🚀 发布** — 发布 Skills 到 registry

Publisher Console（Web）已具备注册/创建 token/发现/详情（UI 细节持续优化中）。

## 📖 什么是 Agent Skills？

[Agent Skills](https://agentskills.io) 是 Anthropic 发布的开放标准，用于为 AI Agent 扩展专业知识和工作流。Skills 是包含指令、脚本和资源的文件夹，Agent 可以动态发现并加载它们。

**skild** 让管理这些 Skills 变得简单 — 把它想象成 AI Agent 的 npm。

## 🛠️ 命令一览

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

提示：可以用 `skild <命令> --help` 查看完整参数（平台/安装位置/registry）。

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

# 查看详情与校验
skild info pdf -t codex --local
skild validate pdf -t codex --local

# 更新与卸载
skild update pdf -t codex --local
skild uninstall pdf -t codex --local
```

## 🧑‍💻 在本仓库开发时如何使用 skild

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
