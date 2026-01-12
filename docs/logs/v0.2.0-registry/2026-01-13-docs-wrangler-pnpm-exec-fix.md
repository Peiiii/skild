# 2026-01-13 文档修正：Wrangler 通过 pnpm 的正确调用方式

## 背景

`workers/registry` 内的 `wrangler` 需要通过 `pnpm exec`（或 `pnpm dlx`）运行；否则 `pnpm -C workers/registry wrangler ...` 可能找不到命令或行为不一致。

## 变更

- 将文档中的部署/本地开发命令统一为：
  - `pnpm -C workers/registry exec wrangler ...`

## 验证

```bash
pnpm build
pnpm lint
pnpm typecheck

# 仅验证命令可用性（可选）
pnpm -C workers/registry exec wrangler --version
```

