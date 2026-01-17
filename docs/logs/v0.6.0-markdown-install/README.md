## 迭代：v0.6.0-markdown-install

### 改了什么
- `skild install` 支持从 GitHub Markdown 文档递归解析技能链接。
- 解析过程提供实时进度提示，完成后以语义树展示并选择安装。
- 树结构自动压缩单子节点层级，信息更精简。

### 验证/验收
- `pnpm release:check`（内部执行 `build`/`lint`/`typecheck`）
- 冒烟：
  - `SKILD_HOME=/tmp/skild-smoke pnpm -s cli -- install https://github.com/ComposioHQ/awesome-claude-skills --yes --target claude --max-skills 5`
- 线上验收（发布后）：
  - `npm view skild version --registry=https://registry.npmjs.org/` 输出 `0.6.0`

### 发布/部署
- 按 `docs/processes/npm-release-process.md` 执行 changeset -> version -> publish。
- 发布范围：`skild`。
- 本次无 migrations，发布后以 npm 线上查询完成闭环。
- 已完成：changeset、`pnpm release:version`、`pnpm release:publish`。
