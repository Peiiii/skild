# v0.11.8 skill-repo-push

## 迭代完成说明

- 新增 `skild push`：将本地 skill 上传/更新到指定 Git 仓库路径（不经过 registry）。
- 默认写入 `skills/<skill-name>`，支持自定义 `--path` 与 `--branch`。
- 默认将 `<repo>` 视为远程（`owner/repo` 或 Git URL）；本地路径可用 `--local` 或显式路径前缀。
- 自动校验 SKILL.md、提交并 push；无变更时直接提示。
- 更新用户使用文档（`docs/usage.md`、`docs/usage.zh-CN.md`）。

## 功能说明

- **目标**：让用户把本地 skill 直接上传/更新到指定 Git 仓库路径，绕开 registry。
- **输入**：`skild push <repo> --dir <skill-dir> [--path <target>] [--branch <branch>] [--message <text>] [--local]`
- **输出**：成功提交并 push；若无变更则提示并退出；校验失败则报错退出。
- **默认策略**：
  - `<repo>` 默认视为远程（`owner/repo` 或 Git URL）。
  - 目标路径默认 `skills/<skill-name>`（来源于 SKILL.md frontmatter.name）。
  - `--local` 或显式路径前缀用于本地仓库。

## 使用方式

- 远程仓库（默认）：`skild push owner/repo --dir ./path/to/skill`
- 远程仓库（Git URL）：`skild push https://github.com/owner/repo.git --dir ./path/to/skill`
- 本地仓库：`skild push /abs/path/to/repo --dir ./path/to/skill --local`
- 指定路径与分支：`skild push owner/repo --dir ./path/to/skill --path skills/demo --branch main`
- 自定义提交信息：`skild push owner/repo --dir ./path/to/skill --message "update demo skill"`

## 测试/验证/验收方式

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟（非仓库目录）：
  - `tmpdir="$(mktemp -d)" && git init --bare "$tmpdir/remote.git" >/dev/null && mkdir -p "$tmpdir/skill" && cat > "$tmpdir/skill/SKILL.md" <<'EOF'\n---\nname: demo-skill\ndescription: demo\nversion: 0.0.1\n---\nEOF\nGIT_AUTHOR_NAME=skild GIT_AUTHOR_EMAIL=skild@example.com GIT_COMMITTER_NAME=skild GIT_COMMITTER_EMAIL=skild@example.com node /Users/peiwang/Projects/skild/packages/cli/dist/index.js push "$tmpdir/remote.git" --dir "$tmpdir/skill" --local && git --git-dir "$tmpdir/remote.git" log --oneline -1`

## 发布/部署方式

- 本迭代仅涉及 CLI 代码变更；按 `docs/release.md` 进行版本发布。
