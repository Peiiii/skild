# 2026-01-15 推文更新：使用真实 Skillset/Alias 示例

## 背景 / 问题

- 推文示例使用占位符，不利于信任与转化

## 决策

- 采用 Skild Hub 上已上线的真实 skillset 与 alias 作为示例

## 变更内容

- 用户可见变化：推文示例改为真实 alias（`claude-dev`/`claude-content`/`superpowers`/`anthropics-skills`）
- 关键实现点：更新 `twitter-quick-install.md` 的中英文内容与链接

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-quick-install.md` 使用真实示例并指向 Hub

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：恢复占位符示例
