## 迭代：v0.6.1-depth-zero

### 改了什么
- `--depth 0` 现在生效，表示仅解析入口文档，不再递归子文档。
- 默认 depth 改为 0，避免未显式设置时深度过大。

### 验证/验收
- `pnpm release:check`（内部执行 `build`/`lint`/`typecheck`）
- 冒烟：
  - `pnpm -s cli -- install https://github.com/ComposioHQ/awesome-claude-skills --depth 0 --yes --target claude --max-skills 5 --local`

### 发布/部署
- `pnpm release:version`
- `pnpm release:publish`
- 线上验证：`npm view skild version --registry=https://registry.npmjs.org/` → `0.6.1`
- 发布范围：`skild`
- 本次无 migrations
