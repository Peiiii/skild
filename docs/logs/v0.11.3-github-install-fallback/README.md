# v0.11.3-github-install-fallback

## 迭代完成说明

- GitHub 安装默认优先走 git clone。
- tarball 下载失败时自动回退；ref 不存在时自动去掉 ref 重试。
- 与 vercel-labs/add-skill 的可靠性策略对齐。

## 测试 / 验证 / 验收方式

- `pnpm release:check`

验收点：

- `skild install <github repo>` 遇到 tarball 失败时，能自动回退继续成功安装。
- 指定不存在的 `#ref` 时，不会直接失败，会回退到默认分支安装。

## 发布 / 部署方式

按 `docs/processes/npm-release-process.md` 完整发布：

```bash
pnpm release:version
pnpm release:publish
```

备注：本次仅影响 npm 包（`@skild/core`、`skild`），无需部署 registry/console。
