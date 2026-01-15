# Skillsets（技能包）

> **一键安装，多技能打包。**

Skillsets 是 Skild 的独特功能，允许你通过一条命令安装多个相关技能。

## 什么是 Skillset？

**Skillset**（技能包）是一组精心策划的技能集合。与逐个安装相关技能不同，Skillsets 让你可以：

- **一次性安装所有内容** — `skild install @scope/data-analyst-pack`
- **获得完整工具链** — 所有依赖自动解析
- **保持整洁** — 相关技能逻辑分组

## Skillset vs Skill

| 特性 | Skill | Skillset |
|------|-------|----------|
| 用途 | 单一能力 | 能力集合 |
| 依赖 | 可选 | 核心特性（打包多个技能） |
| 使用场景 | 特定任务（如 PDF 处理） | 完整工作流（如数据分析） |
| 安装命令 | `skild install @scope/pdf` | `skild install @scope/analyst-pack` |

## 安装 Skillset

安装 Skillset 与安装普通 Skill 完全相同：

```bash
skild install @scope/data-analyst-pack
```

Skild 会自动安装包内所有捆绑的技能。

## 示例 Skillsets

下面是我们精选的一些 Skillsets，你可以直接用 alias（短名）安装：

| Alias（短名） | Registry Skillset | 描述 |
|--------------|-------------------|------|
| `superpowers` | `@peiiii/obra-superpowers-pack` | 规划、调试、TDD、代码评审、验收 |
| `anthropics-skills` | `@peiiii/anthropics-official-pack` | `anthropics/skills` 官方全量技能合集 |
| `claude-office` | `@peiiii/claude-office-pack` | PDF/Word/PPT/Excel + 内部沟通 |
| `claude-design` | `@peiiii/claude-design-pack` | UI/UX、主题、品牌、生成艺术 |
| `claude-dev` | `@peiiii/claude-dev-pack` | 开发/测试工具包（官方 + 社区） |
| `claude-content` | `@peiiii/claude-content-pack` | 调研 + 写作 + 洞察 |

通过 alias 安装：

```bash
skild install claude-dev
```

## 创建你的 Skillset

要创建 Skillset，在 `SKILL.md` 中添加 `skillset: true` 和 `dependencies`：

```yaml
---
name: my-toolkit
version: 1.0.0
description: 我的精选技能集合
skillset: true
dependencies:
  - anthropics/skills/skills/pdf
  - lackeyjb/playwright-skill/skills/playwright-skill
  - ./utils/helper  # 本地子技能
---
```

然后正常发布：

```bash
skild publish
```

## 了解更多

- [创建 Skills](./creating-skills.md)
- [发布 Skills](./publishing.zh-CN.md)
- [Skild Hub - 发现 Skillsets](https://hub.skild.sh/skillsets)
