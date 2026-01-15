# 2026-01-15 推文优化：聚焦 Skillsets + Alias

## 背景 / 问题

- 原推文更强调多技能仓库与快速安装，未突出核心卖点

## 决策

- 以 Skillsets 与 Alias 为核心，重写中英文推文选项

## 变更内容

- 用户可见变化：推文文案改为 “Skillsets + Alias” 主线
- 关键实现点：更新 `twitter-quick-install.md` 的中英文选项

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-quick-install.md` 强调 Skillsets 与 Alias

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：还原旧文案
