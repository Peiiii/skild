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
| Copilot | `-t copilot` | `~/.github/skills` |

示例：

```bash
skild install anthropics/skills/skills/pdf -t codex
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
- Copilot: `./.github/skills`

---

## 管理 Skills

### 列出已安装的 Skills

```bash
skild list
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
| `-t, --target <platform>` | 目标平台：`claude`、`codex`、`copilot` |
| `--local` | 安装到项目目录而非全局 |
| `--force` | 覆盖已有安装 |
| `--json` | 输出 JSON 格式 |

---

## 搜索 Skills

在 Skild registry 中搜索 Skills：

```bash
skild search pdf
```

或者在线浏览：[console.skild.sh](https://console.skild.sh)
