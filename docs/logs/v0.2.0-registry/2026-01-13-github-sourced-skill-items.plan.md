# 2026-01-13 规划：GitHub 作为 Skill Source（Registry 里有 Item，但内容在 GitHub）

## 0) 一句话

让 `registry.skild.sh` 的每个 `@publisher/skill` 都可以选择一种 **source**：托管（R2）或 GitHub（repo+path+ref），并且对用户依然保持**可发现、可验证、可复现**的安装体验；同时避免“平台代发冒充作者”的信任风险。

## 1) 为什么需要这个机制

- 供给侧冷启动：大量高质量 skills 现阶段就托管在 GitHub（官方/社区/公司内仓），搬运到 registry 需要时间、权限、维护成本。
- 平台价值：我们想成为“技能的索引与信任层”，而不仅是“一个 tarball 仓库”。
- 安全/可复现：skills 可能包含脚本/模板/工具调用指引；只指向“branch 最新”会带来供应链风险；必须把“指向 GitHub”设计成可复现的对象（commit pin）。

## 2) 核心原则（不可妥协）

1. **主标识永远是 registry 名称**：安装入口是 `@publisher/skill`，source 只是该条目的来源。
2. **可复现优先**：任何可安装的解析结果必须落到 **commit SHA + content integrity**（branch/tag 只是“输入”，不是“输出”）。
3. **信任可追溯**：UI 必须清晰展示 upstream（repo/ref/path/commit）与验证状态（verified/unverified）。
4. **唯一性**：解析/校验/抓取逻辑只在 `workers/registry` 实现一次；Console 只做展示与操作入口。
5. **不抢占品牌**：除非作者自己认领 scope，否则不允许把第三方内容发布到其品牌 namespace（例如 `@anthropic/*`）。

## 3) 终态用户体验（对标 npm + GitHub packages 的心智）

### 3.1 Discover

- 搜索结果中 `@publisher/skill` 卡片展示：
  - 来源：Hosted / GitHub
  - GitHub repo 链接、commit（可点击）
  - 验证状态：Verified / Unverified

### 3.2 Install（面向 Agent 的消费端）

- 用户安装依然是：`skild install @publisher/skill`
- Registry resolve 返回：
  - `version`（语义版本）
  - `integrity`（内容哈希）
  - `provenance`：`{ sourceType, repo, path, commitSha }`
  - `tarballUrl`（最终仍然提供可下载的 tarball；由 registry 缓存/托管产生）

### 3.3 Publish / Link（面向供给端）

两条路径：

1) **Hosted publish（现有）**：上传 tarball → registry 托管。
2) **GitHub link + import（新增）**：
   - Publisher 在 Console 填 repo/ref/path → 触发 import
   - Registry 拉取内容、校验 Skill 结构、计算 integrity、生成 tarball 并存 R2
   - 生成版本与 dist-tag（例如 `latest`）

> 关键：对消费者来说，永远“从 registry 解析到不可变对象”，而不是“客户端实时去 GitHub 拉最新”。

## 4) API 设计（增量）

### 4.1 创建/更新 GitHub source（供给端）

- `POST /skills/:scope/:skill/source/github`
  - auth：session（Console）或 publish token（CLI 可选）
  - body：
    - `repo`: `owner/repo`
    - `path`: `skills/pdf`（相对 repo root；必须包含 `SKILL.md`）
    - `ref`: `main` / `v1.2.3` / `sha`（输入 ref；最终 resolve 成 sha）
    - `mode`: `mirror` | `index-only`
      - `mirror`：拉取并托管到 R2（推荐）
      - `index-only`：只做索引，不提供可安装解析（仅展示；用于 license 不允许镜像的场景）

- `POST /skills/:scope/:skill/import`
  - 触发一次 import（把 ref 解析成 sha、抓取内容、生成版本）

### 4.2 查询详情（消费端）

在现有详情接口里补字段（保持兼容）：

- `GET /skills/:scope/:skill`
  - 新增：`source`、`provenance`、`verification`

在版本解析接口里补 provenance（可复现）：

- `GET /skills/:scope/:skill/versions/:versionOrTag`
  - 新增：`provenance: { sourceType, repo, path, commitSha }`

## 5) 数据模型（D1）

在现有 `skills` 之外，新增单独表，避免把“source”逻辑散落：

- `skill_sources`
  - `skill_name TEXT PRIMARY KEY`（`@publisher/skill`）
  - `type TEXT NOT NULL`（`hosted` / `github`）
  - `repo TEXT`、`path TEXT`、`ref TEXT`
  - `resolved_commit TEXT`（最后一次成功 import 的 commit SHA）
  - `mode TEXT NOT NULL`（`mirror` / `index-only`）
  - `created_at`, `updated_at`, `last_import_at`, `last_import_error`

可选扩展（后续）：

- `skill_provenance_events`（审计）：import 事件、commit 变化、失败原因、操作者 publisherId
- `source_verifications`：repo 归属验证状态（见下一节）

## 6) Repo 归属验证（Verified / Unverified）

### 6.1 MVP：可用但不“强验证”

- 默认 `unverified`，UI 强提示（黄色 badge）
- 允许 publisher 自助声明 repo 归属，但不影响 install

### 6.2 进阶：可证明归属（建议尽快做，形成差异化）

两种实现二选一（都可）：

1) **Repo 文件证明**（最快）
   - 要求 repo 内存在：`skild.json` 或 `SKILD_PROVENANCE.json`
   - 内容包含：`publisherHandle`, `skillName`, `allowedPaths`, `issuedAt`
   - Registry import 时校验该文件与当前 `@publisher/skill` 对齐

2) **GitHub App / OAuth**（更强，但成本高）
   - publisher 在 Console 绑定 GitHub
   - Registry 知道 repo 的 owner 与 publisher 的绑定关系

## 7) 抓取与托管（mirror）的工程实现（Cloudflare 约束）

### 7.1 获取源码

- 通过 GitHub `tarball` 或 `zipball`（commit SHA）下载
- 解包后取 `path/` 目录作为 Skill 根
- 校验：
  - 必须包含 `SKILL.md`
  - `SKILL.md` frontmatter `name` 与目录名一致（按 agent-skills 规范）
  - 资源大小限制（防止滥用）

### 7.2 生成内容哈希与 artifact

- 对 skill 根目录做 deterministic pack（顺序、权限、行尾）
- 计算 `integrity = sha256Hex(bytes)`
- 写入 R2：`sha256/<integrity>.tgz`
- 在 `skill_versions` 里写版本记录，并更新 dist-tag（如 `latest`）

### 7.3 Import 触发模型

- MVP：同步 import（请求内完成），限制包大小/超时
- 进阶：Cloudflare Queues + background consumer（避免 Worker 超时；支持批量导入）

## 8) 命名空间策略（与导入机制绑定）

对 `anthropics/skills` 的导入：

- 不发布到 `@anthropic/*`（除非 Anthropic 官方认领）
- 建议两种方式：
  1) **`@skild/*` 镜像**：我们维护 mirror，并在 metadata 标记 upstream（最适合“快速上架精选”）
  2) **`@skild-index/*` 索引-only**：用于 license 不允许镜像的条目（仍可被搜索发现，但不可 install）

## 9) 里程碑（最快可交付）

### Milestone 1：Index-only（1-2 天）

- `skill_sources` 表
- Console 新增“Link GitHub source”表单
- 搜索/详情展示 source + links
- 不提供安装解析（避免 license/安全争议）

### Milestone 2：Mirror + 可安装（2-5 天）

- import pipeline：下载 commit tarball → 校验 → 生成 tgz → R2 → `skill_versions`
- `GET /versions/:tag` 返回 provenance（commit + integrity）

### Milestone 3：Verified（后续，但建议尽快）

- repo 文件证明 or GitHub App
- UI 展示 Verified badge + 风险提示

## 10) 风险与对策（必须写清）

- License 风险：默认 `index-only`，mirror 必须要求明确允许分发（或者取得授权）。
- 供应链风险：resolve 输出必须 pin commit；UI 展示 commit；可选强制 Verified 才允许 mirror。
- 资源滥用：限制包大小/频率；import 走队列；记录审计日志。

