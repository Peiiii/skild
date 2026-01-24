## 迭代：v0.7.11-platform-prompt-detection

### 改了什么
- 安装时的平台选择不再仅显示“已安装平台”，改为始终展示全平台。
- 若已安装平台存在，默认预选这些平台，并在列表标注 `[installed]`。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：
```bash
TMPDIR=$(mktemp -d)
SRC="$TMPDIR/source-skill"
mkdir -p "$SRC"
cat > "$SRC/SKILL.md" <<'EOF'
---
name: smoke-skill
description: smoke test
version: 0.0.1
---

# Smoke Skill
EOF
SKILD_HOME="$TMPDIR" SKILD_ENABLE_STATS=0 node packages/cli/dist/index.js install "$SRC" --yes
rm -rf "$TMPDIR"
```
  观察点：输出包含全部平台（claude/codex/copilot/antigravity/opencode/cursor/windsurf）并显示 `Installed ... → all platforms`。

### 发布/部署
- 组件：`workers/registry`、`apps/console`、`apps/web`、`packages/cli`。
- 迁移：`pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（无迁移变更）。
- 部署：
  - `pnpm deploy:workers` → `registry.skild.sh`（Version ID: `a30b78dc-558c-4555-8e44-cc900867215b`）
  - `pnpm deploy:pages` → `https://8958ad15.skild-console.pages.dev`、`https://17ef114a.skild.pages.dev`
- NPM：`pnpm release:version && pnpm release:publish` → `skild@0.10.21`（`@skild/core` 无变更）
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health` → `{ "ok": true }`
  - `curl -fsS "https://registry.skild.sh/discover?limit=1"` → `ok: true` 且有 items
  - `curl -fsS https://hub.skild.sh | head -n 2` → HTML 返回
  - `curl -fsS https://skild.sh | head -n 2` → HTML 返回
  - `npm view skild version` → `0.10.21`
