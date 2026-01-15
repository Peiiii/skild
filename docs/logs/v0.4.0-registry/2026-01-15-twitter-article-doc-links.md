# 2026-01-15 Twitter 文章补充文档链接

## 背景 / 问题

- 文中未覆盖“发布/创建”等更完整流程，容易让读者找不到后续指引

## 决策

- 在中英文文章中新增简短“更多资料”区块，链接到详细文档

## 变更内容

- 用户可见变化：中英文文章新增 “更多资料/More Docs” 区块
- 关键实现点：链接到 GitHub 上的 `docs/publishing-skills.md` 与 `docs/creating-skills.md`

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

验收点：

- `docs/marketing/twitter-article-skild.md` 与 `docs/marketing/twitter-article-skild.zh-CN.md` 包含 GitHub 文档链接

## 发布 / 部署

- 不涉及 npm 包或线上部署

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：移除新增区块
