# 2026-02-04 Skild Skill Doc: Push Command

## 背景 / 问题

- skild 的核心命令文档缺少 `skild push`，导致技能描述不完整

## 决策

- 在 skild skill 文档中补充 `skild push` 用法与注意事项

## 变更内容

- `skills/skild/SKILL.md` 增加 `skild push` 说明与示例

## 功能说明

- **目标**：保证 skild skill 文档覆盖核心 CLI 能力
- **输入**：文档阅读与复制命令
- **输出**：`skild push` 的用途、示例与注意事项
- **默认策略与边界**：
  - 仅补充文档，不改动 CLI 行为

## 使用方式

```bash
# 示例 1：推送到 GitHub
skild push owner/repo --dir ./my-skill

# 示例 2：推送到本地仓库路径
skild push ~/work/skills-repo --local --dir ./my-skill
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `skills/skild/SKILL.md` 包含 `skild push` 用法与示例

## 发布 / 部署

- 无（文档更新）

## 影响范围 / 风险

- Breaking change? 否
- 风险：无
- 回滚方式：移除新增文档段落
