# 2026-01-15 Twitter Article 中文版拆分

## 背景 / 问题

- 需要将中文内容独立成单独文件，避免与英文混在同一篇文章中

## 决策

- 英文保持在原文件
- 中文新增独立 `zh-CN` 文件

## 变更内容

- 用户可见变化：新增中文营销稿文件
- 关键实现点：从原文移除中文内容并新建独立文档

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-article-skild.md` 仅保留英文
- `docs/marketing/twitter-article-skild.zh-CN.md` 包含完整中文稿

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：删除新增文件并还原原文
