# 2026-01-15 推文优化：用真实 Skill/Skillset 解释能力

## 背景 / 问题

- 需要用真实 Skill 与 Skillset 例子来说明 Skild 的核心能力（而非占位符）

## 决策

- 在推文中同时展示真实 Skill 与 Skillset 的 alias 安装示例

## 变更内容

- 用户可见变化：推文主线改为 “Skill + Skillset + Alias”
- 关键实现点：使用 Hub 上真实条目（`pdf`、`@peiiii/hello-skill`、`claude-dev`、`superpowers`）

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-quick-install.md` 同时包含 Skill 与 Skillset 的真实示例

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：恢复旧文案
