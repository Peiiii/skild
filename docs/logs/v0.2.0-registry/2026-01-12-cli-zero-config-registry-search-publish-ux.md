# 2026-01-12 Registry CLI：默认 Registry + 零配置登录/安装 + 搜索 + 发布体验优化

## 背景 / 问题

- 目标对齐 npm 的使用习惯：默认 registry、零配置即可完成 login/install/publish 的闭环
- 不引入额外“用户配置文件”（暂不做 `.skildrc` / project config），只保留必要的登录凭证存储
- 发布需要更“傻瓜化”：本地 Skill 不一定在 `SKILL.md` 里写 `@publisher/skill`，希望 CLI 能推断并补齐

## 决策

- 默认 registry 固定为 `https://registry.skild.sh`（可用 `--registry` 或 `SKILD_REGISTRY_URL` 覆盖）
- 不新增任何用户可编辑配置文件（只使用既有的登录凭证存储：`~/.skild/registry-auth.json`）
- `skild publish` 允许使用无 scope 的 `name`（如 `hello-skill`），由当前登录的 publisher handle 自动补齐为 `@handle/hello-skill`
- 增加最小 discover：`skild search <query>`（对齐 npm 的 search 心智）

## 变更内容

### Core（`packages/core`）

- 新增默认 registry 常量：`DEFAULT_REGISTRY_URL = https://registry.skild.sh`
- `resolveRegistryUrl()`：显式 `--registry` → `SKILD_REGISTRY_URL` → 默认 registry
- registry 安装记录补齐 `registryUrl`（为后续 update 可复现；旧记录向后兼容）
- 新增 registry 搜索：`searchRegistrySkills()`

### CLI（`packages/cli`）

- `skild login` / `skild signup`：`--registry` 变为可选（默认 `https://registry.skild.sh`）
- `skild install @publisher/skill`：`--registry` 可选（默认 `https://registry.skild.sh`）
- `skild publish`：
  - `--registry` 可选（默认使用当前登录对应 registry；否则默认 registry）
  - `--name` 支持无 scope 名称：自动推断 `@handle/<name>`
- 新增：`skild search <query> [--limit] [--registry]`

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

curl -fsS https://registry.skild.sh/health

# 基本 discover
pnpm -s cli search pdf --json

# 零配置登录（默认 registry）
pnpm -s cli signup --email you@example.com --handle <your-handle> --password '...'
pnpm -s cli login --handle-or-email <your-handle> --password '...'
pnpm -s cli whoami

# 发布更傻瓜化：name 可不带 scope（会自动补齐为 @<handle>/hello-skill）
pnpm -s cli publish --dir ./examples/hello-skill --name hello-skill --skill-version 0.0.1

# 零配置安装（默认 registry）
pnpm -s cli install @<your-handle>/hello-skill -t codex --local --force
pnpm -s cli list -t codex --local
```

验收点：

- `skild login/signup/install/search` 不需要 `--registry` 也能正常访问 `https://registry.skild.sh`
- `skild publish --name hello-skill` 会补齐为 `@<handle>/hello-skill` 并发布成功
- `skild search` 不会卡住（默认指向官方 registry；不依赖本地 dev registry 的登录状态）

