# v0.12.0 skill-repo-push

## 迭代完成说明

- 新增 `skild push`：将本地 skill 上传/更新到指定 Git 仓库路径（不经过 registry）。
- 默认写入 `skills/<skill-name>`，支持自定义 `--path` 与 `--branch`。
- 默认将 `<repo>` 视为远程（`owner/repo` 或 Git URL）；本地路径可用 `--local` 或显式路径前缀。
- 对 `owner/repo`：如检测到 SSH agent key，将优先使用 SSH；否则回退到 HTTPS。
- 自动校验 SKILL.md、提交并 push；无变更时直接提示。
- 更新用户使用文档与入口索引（`docs/usage.md`、`docs/usage.zh-CN.md`、`docs/README.md`、`docs/README.zh-CN.md`、`README.md`、`README.zh-CN.md`、`packages/cli/README.md`）。
- 官网与 Console 增加 `skild push` 的功能入口与示例（Hero/Features/Terminal/Publish 页）。
- GitHub README 结构调整：Quick Start 更贴近官网首页，命令总览前置。
- GitHub README Quick Start 仅保留最小命令，功能细节下沉到后文。
- GitHub README Quick Start 加入首页终端中的核心命令（install/list/update/push）。
- GitHub README 命令总览顺序优化（validate/ sync/ extract/search 排序调整）。
- GitHub README 章节顺序调整：同步章节前置，创建章节后置以对齐命令顺序。

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
  - 远程（默认选择 SSH 时）：`tmpdir="$(mktemp -d)" && mkdir -p "$tmpdir/skill" && cat > "$tmpdir/skill/SKILL.md" <<'EOF'\n---\nname: demo-skill-smart\ndescription: demo smart\nversion: 0.0.1\n---\nEOF\nGIT_AUTHOR_NAME=skild GIT_AUTHOR_EMAIL=skild@example.com GIT_COMMITTER_NAME=skild GIT_COMMITTER_EMAIL=skild@example.com node /Users/peiwang/Projects/skild/packages/cli/dist/index.js push Peiiii/skills --dir "$tmpdir/skill"`
  - Web/Console 文案检查：`tmpdir="$(mktemp -d)" && cp -R /Users/peiwang/Projects/skild/apps/web/dist "$tmpdir/web" && cp -R /Users/peiwang/Projects/skild/apps/console/dist "$tmpdir/console" && (cd "$tmpdir/web" && python3 -m http.server 8173 >/dev/null 2>&1 & echo $! > "$tmpdir/web.pid") && sleep 1 && curl -fsS http://127.0.0.1:8173/index.html | rg -n "skild push" && kill "$(cat "$tmpdir/web.pid")" && (cd "$tmpdir/console" && python3 -m http.server 8174 >/dev/null 2>&1 & echo $! > "$tmpdir/console.pid") && sleep 1 && jsfile="$(rg -n "src=\\\"/assets/.*\\.js\\\"" -o "$tmpdir/console/index.html" | sed -E "s/.*\\\"(\\/assets\\/.*\\.js)\\\".*/\\1/" | head -n 1)" && curl -fsS "http://127.0.0.1:8174${jsfile}" | rg -n "Push to a Git repo" && kill "$(cat "$tmpdir/console.pid")"`

## 发布/部署方式

- NPM：
  - `pnpm release:version`
  - `pnpm release:publish`
- 远程 migrations：
  - `pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`
- 部署：
  - `pnpm deploy:workers`
  - `pnpm deploy:console`
  - `pnpm deploy:web`
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health`
  - `curl -fsSI https://hub.skild.sh | head -n 5`
  - `curl -fsSI https://skild.sh | head -n 5`
  - `pnpm -s dlx skild@0.12.0 -- --help`
