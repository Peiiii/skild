## 迭代：v0.7.3-sync-gap-tree

### 改了什么
- `skild sync` 逻辑升级：自动汇总所有平台已安装的 skills，计算缺失矩阵，默认全选并以树形结构（全部 → 平台 → 技能）交互选择要补齐的目标。
- 同步源优先级：优先使用指定/默认平台的安装，其次 registry 记录，最后其他平台的本地安装副本；非 registry 源复用源安装目录保证一致性。
- 文档与指令同步更新（中英文使用文档、命令索引、skills 命令参考）。

### 验证/验收
- ✅ `pnpm lint`
- ✅ `pnpm typecheck`
- ✅ `pnpm build`
- 冒烟：`node packages/cli/dist/index.js sync --help`

### 发布/部署
- npm 发布：`skild@0.9.0` 已发布（流程：`pnpm changeset` → `pnpm release:version` → `pnpm release:publish`，其中 release:publish 已包含 build/lint/typecheck）。
- 无后端/数据库变更。
