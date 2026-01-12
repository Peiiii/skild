# 2026-01-13 用户文档：skild 完整使用指南 + README 入口

## 目标

- 给用户一份“端到端能用”的文档：本地安装/管理 + registry 搜索/发布 + Console（Web）
- 在 README 中提供清晰入口，避免用户只看 Quick Start 但找不到完整说明

## 变更

- 新增完整使用文档：
  - `docs/usage.md`（English）
  - `docs/usage.zh-CN.md`（简体中文）
- README 增加入口并同步更新命令/功能信息：
  - `README.md`
  - `README.zh-CN.md`
  - `docs/README.md`
  - `packages/cli/README.md`
- `docs/cli.md` 保持轻量，增加指向完整文档的链接

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
```

手动验收点：

- `README.md`/`README.zh-CN.md` 能快速找到完整文档入口
- 文档内容与当前 CLI 命令一致（含 `signup/login/whoami/logout/search/publish`）

## 发布 / 部署

- 本次为文档更新，不需要部署。
- 如需发布 npm 包，走维护者流程：`docs/release.md`

