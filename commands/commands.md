# Commands

- `/new-command`: 新建一条指令的元指令。流程：确认名称、用途、输入格式、输出/期望行为，写入本文件并保持 `AGENTS.md` 索引同步。
- `/config-meta`: 调整或更新 `AGENTS.md` 中的机制/元信息（如规则、流程、索引等）的指令。执行时需明确变更点与预期影响。
- `/commit`: 进行提交操作（提交信息需使用英文）。
- `/validate`: 对项目进行验证，至少运行 `build`、`lint`、`tsc`，必要时补充冒烟测试。执行前需确认验证范围和可跳过项。

（后续指令在此追加，保持格式一致。） 

---

## extract-github-skills

- **名称**：`extract-github-skills`
- **用途**：从 GitHub 链接解析技能树并导出完整技能目录（含全部文件）。
- **输入格式**：`skild extract-github-skills <source> [--out <dir>] [--force] [--depth <n>] [--scan-depth <n>] [--max-skills <n>]`
- **输出/期望行为**：
  - 输出目录树与 `catalog.json`
  - 每个技能目录包含完整内容与 `skill.json`

## sync

- **名称**：`skild sync`
- **用途**：跨平台补齐已安装的 skills：自动汇总所有平台的安装集合，计算缺失列表并以树形交互选择同步目标，保持安装源/版本一致。
- **输入格式**：`skild sync [skills...] [--to <platforms>] [--all] [--local] [--yes] [--force] [--json]`
- **输出/期望行为**：
  - 自动发现“缺失技能 × 目标平台”矩阵，默认全选；TTY 下提供“全部→平台→技能”的树形选择
  - 复用已安装内容（非 registry 源时复制源目录；registry 保持同版本安装）
  - JSON 模式输出同步结果（成功/跳过/失败）

## push

- **名称**：`skild push`
- **用途**：将本地 skill 目录上传/更新到指定 Git 仓库路径（不经过 registry）。
- **输入格式**：`skild push [repo] [--dir <path>] [--path <path>] [--branch <branch>] [--message <text>] [--local]`
- **输出/期望行为**：
  - 校验本地 SKILL.md 与 frontmatter
  - 克隆仓库并将 skill 写入目标路径（默认 `skills/<skill-name>`）
  - 默认将 `<repo>` 视为远程（`owner/repo` 或 Git URL）；本地路径请用 `--local` 或 `./path`/`/abs/path`
  - 当省略 `<repo>` 时使用 `push.defaultRepo` 默认仓库
  - `owner/repo` 会先尝试 SSH，认证失败时回退到 HTTPS
  - 若无变更则提示并退出；有变更则提交并 push

## config

- **名称**：`skild config`
- **用途**：读取或设置全局配置（如默认平台、默认 push 仓库）。
- **输入格式**：
  - `skild config get <key>`
  - `skild config set <key> <value>`
  - `skild config unset <key>`
  - `skild config list`
- **输出/期望行为**：
  - 支持配置项 `defaultPlatform`、`defaultScope`、`push.defaultRepo`
  - `push.defaultRepo` 作为 `skild push` 的默认仓库兜底；显式 `skild push <repo>` 优先
