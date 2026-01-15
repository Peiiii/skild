# 2026-01-15 中文标题突出 Skillsets

## 背景 / 问题

- 中英文标题仅写“npm for skills”，不足以让人想到 skillset 组合能力

## 决策

- 中英文标题直指 “Skills + Skillsets” 并保留平台举例，避免写死平台

## 变更内容

- 用户可见变化：中英文标题新增 Skillsets 并增加平台省略号
- 关键实现点：更新中英文文案标题

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-article-skild.zh-CN.md` 标题包含 “Skills & Skillsets”
- `docs/marketing/twitter-article-skild.md` 标题包含 “Skills & Skillsets”

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：还原标题
