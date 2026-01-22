# v0.11.5-install-command-clean

## 迭代完成说明

- Linked/GitHub 安装命令在没有 `#ref` 时不再强制双引号包裹。
- `#main/#master` 仍按默认分支处理，安装命令不再显示。
- skild Skill 增加“索引检索 + 管理”代理使用指引。

## 测试 / 验证 / 验收方式

- `pnpm release:check`

验收点：

- `/linked-items` 与 `/discover` 的 `install` 字段在无 `#ref` 时不含双引号。
- 仍保留 `#ref` 的安装命令会自动带引号。

## 发布 / 部署方式

后端变更，按闭环执行：

```bash
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote
pnpm deploy:registry
curl -fsS "https://registry.skild.sh/linked-items?limit=20" | jq -r '.items[].install'
```
