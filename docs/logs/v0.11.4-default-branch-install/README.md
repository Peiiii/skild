# v0.11.4-default-branch-install

## 迭代完成说明

- Linked/GitHub 安装命令输出默认不再显示主分支 `#main/#master`。
- `discover` 列表对存量 linked 数据动态重算安装命令，确保旧数据也不再带 `#main/#master`。
- 相关示例与策略文档同步更新为“默认分支不写 ref”。

## 测试 / 验证 / 验收方式

- `pnpm release:check`

验收点：

- Registry `/discover` 与 `/linked-items` 返回的 `install` 不再包含 `#main/#master`。
- 复制出的命令能正常安装（默认分支）。

## 发布 / 部署方式

后端变更，按闭环执行：

```bash
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote
pnpm deploy:registry
curl -fsS "https://registry.skild.sh/linked-items?limit=1" | jq -r '.items[0].install'
```

