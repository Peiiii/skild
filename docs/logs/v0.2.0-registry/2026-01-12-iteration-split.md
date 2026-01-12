# 2026-01-12 v0.2 规划调整：拆分两次迭代（先纯 Registry）

## 背景 / 问题

- 把 “GitHub 收录/登录/同步/验证” 与 “registry 的发布/安装/版本化” 放在同一次迭代，会让范围与叙事变得混乱
- 我们需要先把 `@publisher/skill` 的价值闭环做扎实：发布、版本、可复现、可信与成本可控（Cloudflare）

## 决策

- v0.2.0 仅做 **纯托管 registry（npm-like）**，不与 GitHub 身份体系直接绑定
- GitHub 相关能力延后为 **Iteration 2**，在文档里只保留粗略目标
- 公网 API 资源名统一使用 `/skills`（领域语言一致），避免 `/packages` 的歧义

## 变更内容

- 重写规划文档结构：`docs/logs/v0.2.0-registry/README.md`
  - Iteration 1：托管分发 + 多版本 + dist-tags + Cloudflare 成本控制
  - Iteration 2：GitHub source/verification（粗略目标，不展开）

## 验证

```bash
pnpm build
pnpm lint
pnpm typecheck
```

## 发布 / 部署

本次仅为规划文档调整，无需发布。

