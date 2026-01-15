# 安装 Skills

本指南介绍安装和管理 Skills 的各种方式。

---

## 安装来源

### 从 GitHub 安装

最常用的安装方式：

```bash
# 简写形式（推荐）
skild install anthropics/skills/skills/pdf

# 完整 URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
```

### 从本地目录安装

安装本地文件系统中的 Skill：

```bash
skild install ./path/to/my-skill
```

### 多 skill 目录 / 仓库（一次安装多个）

如果 `<source>` 根目录没有 `SKILL.md`，但在子目录里包含多个 Skill（例如 `skills/*/SKILL.md`），`skild` 可以自动识别。

- 在交互式终端（TTY）下，`skild install <source>` 会提示你是否一键安装全部。
- 在非交互场景下，请使用 `--recursive`（或 `-y`）继续。

```bash
# 一键安装发现的所有 Skills
skild install https://github.com/owner/repo/tree/main --recursive
```

### 从 Skild Registry 安装

安装官方发布的 Skills：

```bash
skild install @publisher/skill-name

# 指定版本
skild install @publisher/skill-name@1.2.3
```

---

## 目标平台

Skild 支持多个 AI Agent 平台：

| 平台 | 选项 | 安装路径 |
|------|------|----------|
| Claude | `-t claude`（默认） | `~/.claude/skills` |
| Codex | `-t codex` | `~/.codex/skills` |
| OpenCode | `-t opencode` | `~/.config/opencode/skill` |
| Cursor | `-t cursor` | `~/.cursor/skills` |
| Windsurf | `-t windsurf` | `~/.windsurf/skills` |
| Copilot | `-t copilot` | `~/.github/skills` |
| Antigravity | `-t antigravity` | `~/.gemini/antigravity/skills` |

示例：

```bash
skild install anthropics/skills/skills/pdf -t codex
```

一次性安装到所有平台：

```bash
skild install anthropics/skills/skills/pdf --all
```

---

## 全局 vs 项目级别

默认情况下，Skills 会安装到全局。使用 `--local` 可以安装到项目级别：

```bash
# 全局（默认）
skild install @publisher/skill

# 项目级别（当前目录）
skild install @publisher/skill --local
```

项目级别路径：
- Claude: `./.claude/skills`
- Codex: `./.codex/skills`
- OpenCode: `./.opencode/skill`
- Cursor: `./.cursor/skills`
- Windsurf: `./.windsurf/skills`
- Copilot: `./.github/skills`
- Antigravity: `./.agent/skills`

---

## 管理 Skills

### 列出已安装的 Skills

```bash
skild list
```

### 通过 alias（短名）安装

如果某个 skill/skillset 配置了 alias，可以直接用短名安装：

```bash
skild install superpowers
```

### 查看 Skill 详情

```bash
skild info skill-name
```

### 更新 Skills

```bash
# 更新全部
skild update

# 更新指定 Skill
skild update skill-name
```

### 卸载

```bash
skild uninstall skill-name
```

### 验证

```bash
skild validate skill-name
```

---

## 选项参考

| 选项 | 说明 |
|------|------|
| `-t, --target <platform>` | 目标平台：`claude`、`codex`、`copilot`、`antigravity`、`opencode`、`cursor`、`windsurf` |
| `--all` | 一次性安装到所有平台 |
| `--recursive` | 如果 source 是多 skill 目录/仓库，一键安装发现的所有 Skills |
| `-y, --yes` | 跳过确认提示（默认同意） |
| `--depth <n>` | 扫描 `SKILL.md` 的最大目录深度（默认：6） |
| `--max-skills <n>` | 发现技能数量的安全上限（默认：200） |
| `--local` | 安装到项目目录而非全局 |
| `--force` | 覆盖已有安装 |
| `--json` | 输出 JSON 格式 |

---

## 搜索 Skills

在 Skild registry 中搜索 Skills：

```bash
skild search pdf
```

或者在线浏览：[hub.skild.sh](https://hub.skild.sh)
