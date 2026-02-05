# 2026-02-05 Default Push Repo Config

## 背景 / 问题

- `skild push` 必须显式传 repo，频繁重复输入
- 需要明确“默认 repo”含义的配置项命名与机制

## 决策

- 新增 `skild config` 命令，提供 `get/set/unset/list`
- 默认仓库配置键采用 `push.defaultRepo`，并兼容 `push.repo` 别名（提示弃用）
- `skild push` 的优先级：显式参数 > 环境变量 `SKILD_DEFAULT_PUSH_REPO` > 配置默认值
- `owner/repo` 先尝试 SSH，认证失败时回退到 HTTPS

## 变更内容

- CLI 增加 `skild config` 并写入全局配置
- `skild push` 支持省略 `<repo>`，自动使用默认仓库
- `skild push` 对 `owner/repo` 启用 SSH→HTTPS 自动回退
- 文档补充默认 push repo 的说明与示例

## 功能说明

- 目标/范围：为 `skild push` 提供默认仓库兜底，减少重复输入
- 输入：
  - `skild config set push.defaultRepo <owner/repo|url|path>`
  - `skild push [repo] --dir <skill-dir>`
- 输出：
  - `skild push` 省略 `<repo>` 时使用默认仓库并正常提交/推送
  - 若未配置默认仓库且省略 `<repo>`，提示如何配置
- 默认策略与边界：
  - `skild push <repo>` 永远覆盖默认值
  - `SKILD_DEFAULT_PUSH_REPO` 仅对当前 shell 生效
  - `owner/repo` 会先尝试 SSH，失败时回退到 HTTPS

## 使用方式

```bash
# 设置默认仓库
skild config set push.defaultRepo owner/repo

# 省略 <repo> 直接 push
skild push --dir ./my-skill

# 临时覆盖默认仓库
SKILD_DEFAULT_PUSH_REPO=owner/repo skild push --dir ./my-skill
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

tmpdir="$(mktemp -d)"
skill="$tmpdir/skill"
repo="$tmpdir/remote.git"
mkdir -p "$skill"
cat > "$skill/SKILL.md" <<'EOF'
---
name: default-push-skill
description: smoke test
version: 0.0.1
---
EOF
git init --bare "$repo" >/dev/null
SKILD_HOME="$tmpdir/home" node /Users/peiwang/Projects/skild/packages/cli/dist/index.js config set push.defaultRepo "$repo"
SKILD_HOME="$tmpdir/home" GIT_AUTHOR_NAME=skild GIT_AUTHOR_EMAIL=skild@example.com GIT_COMMITTER_NAME=skild GIT_COMMITTER_EMAIL=skild@example.com node /Users/peiwang/Projects/skild/packages/cli/dist/index.js push --dir "$skill"
git --git-dir "$repo" log --oneline -1
```

验收点：

- `pnpm build/lint/typecheck` 无报错
- `skild push` 提示使用默认仓库并成功提交
- `git log --oneline -1` 能看到最新提交
- SSH/HTTPS 自动回退需依赖真实 GitHub 认证，未在本地冒烟覆盖

## 发布 / 部署

无。

## 影响范围 / 风险

- Breaking change? 否（新增配置与可选参数）
- 回滚方式：移除 `push.defaultRepo` 配置，恢复显式传参
