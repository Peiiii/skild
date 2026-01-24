## 迭代：v0.7.12-portable-install-record

### 改了什么
- 安装记录与锁文件不再持久化 `installDir` 的绝对路径，避免跨设备/协作冲突。
- 读取安装记录时根据 `platform/scope/name` 运行时派生 `installDir`，并为外部依赖补齐派生路径。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：
```bash
TMPDIR=$(mktemp -d)
SRC="$TMPDIR/source-skill"
mkdir -p "$SRC"
cat > "$SRC/SKILL.md" <<'SKILL_EOF'
---
name: smoke-skill
description: smoke test
version: 0.0.1
---

# Smoke Skill
SKILL_EOF
SKILD_HOME="$TMPDIR" SKILD_ENABLE_STATS=0 node packages/cli/dist/index.js install "$SRC" --yes
cat "$TMPDIR/.codex/skills/source-skill/.skild/install.json" | rg -n "installDir" && exit 1 || true
rm -rf "$TMPDIR"
```
  观察点：安装成功，且 `install.json` 中不包含 `installDir` 字段。

### 发布/部署
- 组件：`workers/registry`、`apps/console`、`apps/web`、`packages/cli`。
- 迁移：`pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（无迁移变更）。
- 部署：
  - `pnpm deploy:workers` → `registry.skild.sh`（Version ID: `1b03445f-fc0d-4d16-949f-d9912f281097`）
  - `pnpm deploy:pages` → `https://6e047b0e.skild-console.pages.dev`、`https://102afdb3.skild.pages.dev`
- NPM：`pnpm release:version && pnpm release:publish` → `skild@0.10.22`、`@skild/core@0.10.22`
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health` → `{ "ok": true }`
  - `curl -fsS "https://registry.skild.sh/discover?limit=1"` → `ok: true` 且有 items
  - `curl -fsS https://hub.skild.sh | head -n 2` → HTML 返回
  - `curl -fsS https://skild.sh | head -n 2` → HTML 返回
  - `npm view skild version` → `0.10.22`
  - `npm view @skild/core version` → `0.10.22`
