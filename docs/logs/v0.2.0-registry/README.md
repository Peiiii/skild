# v0.2.0 Registry Core（纯托管分发）

**状态**: 规划中  
**目标版本**: v0.2.0  
**定位**: 为 Agent Skills 提供“统一分发平台”（npm-like），先把“发布/安装/版本化/可复现/可信”闭环做扎实；不与 GitHub 身份体系直接绑定。

---

## 一句话定义（对外）

**Skill = 可审计的 Agent 工作流包**（指令 + 脚本/工具 + 资源）。  
**skild registry = 让它们像 npm 一样可发现、可安装、可验证、可复现（先做纯托管分发，后续再接 GitHub）。**

---

## 核心原则（架构/产品）

- **身份与来源解耦**：平台包名（registry identity）≠ 外部来源地址（source identity）
- **唯一性**：同一能力不重复实现；核心规则只在 core 层沉淀
- **本地可复现**：安装必须 resolve 到不可变标识（hosted integrity / resolved artifact）
- **可信与可审计优先**：发布者身份、版本、内容哈希必须可追溯
- **UI 不依赖业务逻辑**：Web 只做展示与交互；业务逻辑归属 core/server

---

## 迭代拆分（已拍板）

### Iteration 1（v0.2.0）：纯 Registry（托管分发）

- 不依赖/绑定 GitHub 登录
- 只做平台托管发布（tarball + integrity）
- 保持 CLI 现有安装管线，新增 “从 registry 解析并安装” 能力

---

## Iteration 2（粗略目标，仅用于方向对齐）

> 不展开设计细节与实现方案，只定义终态方向，避免影响 v0.2.0 的范围收敛。

- 支持 GitHub source：`gh:<owner>/<repo>#<ref-or-sha>:<path>` 作为可安装来源，并可被 registry 条目引用
- 验证与可信：
  - `verified`：repo/org owner 可证明归属（如 GitHub App 权限或 repo 内声明文件）
  - UI/CLI 明确展示 provenance（verified/unverified/community）
- 同步策略：
  - 展示层可以“跟随分支”
  - 安装层必须 resolve 到 commit SHA，并写入 lock（可复现）
- 命名空间：
  - 仍以 `@publisher/skill` 为唯一稳定入口
  - 允许 scope 认领与绑定 GitHub identity，但不强制

---

## 命名与标识（Iteration 1）

### 1) 平台主标识（用户安装/依赖的稳定入口，稳定不变）

- **永远是**：`@publisher/skill`
- 安装示例：`skild install @acme/pdf`

### 2) 多版本机制（必须支持）

- 版本是不可变对象：`@publisher/skill@1.2.3` 一旦发布不可覆盖
- 支持 `dist-tags`（最少 `latest`，可选 `canary`）
- 安装策略（先简化，不引入 npm 的复杂依赖复杂度）：
  - `skild install @publisher/skill` → `latest`
  - `skild install @publisher/skill@1.2.3` → 精确版本
  - 暂不支持 `^/~` range 与依赖树（后续再评估）

---

## v0.2.0 交付范围（Iteration 1 MVP）

### A. Registry（服务端 + 数据模型 + 存储）

- 数据模型（最小可用）：
  - `Skill`：`name(@scope/skill)`, `description`, `targets[]`, `publisherId`, `createdAt/updatedAt`
  - `SkillVersion`：`version`, `integrity`, `artifactKey`, `publishedAt`, `publisherId`
  - `DistTags`：`latest`, `canary`（可选）
- 存储（托管分发）：
  - artifact 存储：R2（tarball）
  - 以 `integrity` 为主的 content-addressed key（天然去重）
  - 版本与 artifact 绑定不可变（immutable）

### B. Auth（发布）

- skild 账号体系（不依赖 GitHub）：登录后签发 publish token（CLI 使用）
- scope 归属：只有 scope owner 才能在 `@publisher/*` 下发布

### C. CLI（安装体验闭环）

- 新增：`skild install @publisher/skill`
  - 解析包名 → registry resolve 到精确版本 + `integrity` + tarball → 走现有本地安装管线
- 新增：`skild publish`（打包并上传到 registry）
- 新增：`skild login/logout/whoami`
- 新增：`skild info @publisher/skill`（展示版本、publisher、integrity）

### D. Web（发现与可信）

- MVP：skills 列表/详情页 + 安装命令复制（`skild install @publisher/skill`）
- 只做 UI，所有规则由 API/core 保证一致性（避免前后不一致）

---

## API（最小集合）

- `GET /skills`（列表/搜索基础）
- `GET /skills/:scope/:skill`（详情：dist-tags、版本摘要）
- `GET /skills/:scope/:skill/versions/:versionOrTag`（解析与元数据：integrity、artifact）
- `POST /auth/*`（登录/令牌）
- `POST /skills/:scope/:skill/publish`（上传发布）

---

## Cloudflare 成本控制（设计要点）

- **R2 存 tarball**，key 使用 `integrity` 做 content-addressed（去重 + 不可变）
- **Workers 只做解析/鉴权/签发或 302 重定向**，避免代理大文件
- **强缓存**：
  - tarball：`Cache-Control: public, max-age=31536000, immutable`
  - 元数据：ETag + `stale-while-revalidate`
- **写入可控**：publish 必须 auth；按账号/namespace 限频；WAF/Turnstile（必要时）

---

## 非目标（Iteration 1 明确不做）

- 不做“全功能 npm”：
  - 不做复杂依赖树/semver range（先只做单包 install + lock 复现）
  - 不做私有包/付费（先闭环公域）
- 不做 GitHub 收录/同步/验证（放 Iteration 2）

---

## 里程碑（只写顺序与交付物）

### Milestone 0：RFC + 数据模型冻结

- 产出：API 草案、Skill/Version/DistTags schema、命名与版本规则

### Milestone 1：Registry Read（可发现/可安装）

- API：`GET /skills`, `GET /skills/:scope/:skill`, `GET /skills/:scope/:skill/versions/:versionOrTag`
- CLI：`install @scope/name` 可用
- Web：列表/详情最小可用

### Milestone 2：Registry Write（发布闭环）

- Auth：登录 + token（CLI）
- Publish：`skild publish` → `POST /skills/:scope/:skill/publish` → R2 artifact
- dist-tags：`latest` 可用

### Milestone 3：可复现与治理

- 安装 resolve 固化：metadata/lock 记录 `version + integrity + artifactKey`
- 基础滥用控制：限频、配额、删除策略（如需要）

---

## 验收标准（必须可证明）

### 功能验收

- 用户能在 registry 看到一个 skill，并通过包名安装：
  - `skild install @publisher/skill`
- 多版本可用：
  - `skild install @publisher/skill@1.2.3` 可安装历史版本
  - `skild install @publisher/skill` 使用 `latest` 且 resolve 到具体版本
- 安装结果可复现：
  - lock/metadata 记录 `version + integrity`
  - `skild update` 不会 silently 改写到不确定内容

### 工程验收

- 每个阶段至少一次：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm typecheck`

---

## 发布 / 部署（本迭代会新增）

- Registry 服务端的部署形态（待定）：`workers/registry`（Worker）+ `apps/web`（UI）
- 版本发布：
  - npm（CLI/core）：沿用 `pnpm release`（Changesets）
  - Web/Server：引入独立的 deploy pipeline（不与 npm publish 混在一起）

详细发布流程引用：`docs/release.md`

---

## 本目录文件

- `docs/logs/v0.2.0-registry/README.md`：v0.2.0 Iteration 1 规划（纯 registry）
- `docs/logs/v0.2.0-registry/2026-01-12-iteration-split.md`：规划拆分记录（为什么拆、拆成什么）
- `docs/logs/v0.2.0-registry/2026-01-12-registry-iteration1-mvp.md`：Iteration 1 实现记录（registry MVP + 验证/部署）
- `docs/logs/v0.2.0-registry/2026-01-12-registry-worker-move-and-prod-deploy-fix.md`：Worker 目录调整 + 线上部署修复
- `docs/logs/v0.2.0-registry/2026-01-12-cli-zero-config-registry-search-publish-ux.md`：默认 registry + 零配置登录/安装 + 搜索 + 发布体验优化
