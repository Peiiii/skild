# 2026-01-15 推文对齐 landing page 终端示例

## 背景 / 问题

- 推文示例需要与 landing page 的第 1/3 个终端保持一致

## 决策

- 采用 landing page 的真实命令：skillset alias、整仓安装、多来源安装

## 变更内容

- 用户可见变化：推文示例改为 landing page 终端命令
- 关键实现点：更新 `twitter-quick-install.md` 的中英文选项

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-quick-install.md` 包含 `superpowers`、`anthropics/skills`、`@peiiii/skild` 示例

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：恢复旧文案
