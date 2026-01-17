# PRD: extract-github-skills

## Introduction / Overview
新增命令 `skild extract-github-skills`，从 GitHub 仓库或目录的 Markdown 入口解析技能树，并将每个技能的**完整组成部分**导出到本地目录结构中。输出包含可浏览的目录树与结构化清单，便于后续浏览、审计或二次处理，但不执行安装。

## Goals
- 从 GitHub 链接解析技能树并导出完整技能目录
- 兼顾单技能与多技能仓库/目录
- 输出结构化目录树并生成清单文件
- 对用户透明：命令名即表达 “从 GitHub 提取 skills”

## User Stories

### US-001: 导出技能树
**Description:** 作为用户，我希望输入 GitHub 链接后得到一份本地技能目录树，以便离线查看或分享。

**Acceptance Criteria:**
- [ ] 命令 `skild extract-github-skills SOURCE` 可运行并输出目录树
- [ ] 输出包含清单文件（catalog.json）及每个技能目录
- [ ] typecheck / lint / build 通过

### US-002: 导出完整技能内容
**Description:** 作为用户，我希望每个导出的技能包含其所有组成部分（完整文件），便于后续复用。

**Acceptance Criteria:**
- [ ] 每个技能目录包含原始技能文件（含 SKILL.md 与资源文件）
- [ ] 每个技能目录包含 `skill.json` 元数据文件
- [ ] typecheck / lint / build 通过

### US-003: 安全覆盖与输出路径
**Description:** 作为用户，我希望输出目录可控且不会误覆盖已有内容。

**Acceptance Criteria:**
- [ ] `--out` 支持指定输出目录
- [ ] 默认输出目录为 `./skild-github-skills`
- [ ] 若目录存在，需 `--force` 才覆盖
- [ ] typecheck / lint / build 通过

## Functional Requirements
- FR-1: 命令 `skild extract-github-skills SOURCE` 支持 GitHub URL/owner/repo/路径格式。
- FR-2: 使用 Markdown 解析与技能发现能力构建树形结构（折叠单子节点层级）。
- FR-3: 每个技能导出为独立目录，包含完整技能文件与 `skill.json`。
- FR-4: 输出根目录包含 `catalog.json`（记录树结构、技能元数据、源链接、导出路径）。
- FR-5: 支持参数 `--out`、`--force`、`--depth`、`--scan-depth`、`--max-skills`。
- FR-6: 遇到名称冲突时自动生成稳定且可读的目录名（基于树路径）。

## Non-Goals (Out of Scope)
- 不执行安装、不写入 Skild 安装目录
- 不发布技能、不写入 registry
- 不生成 UI 预览页面（仅目录 + JSON）

## Design Considerations
- 目录结构采用“折叠单子节点后的树路径”作为导出路径，尽量精简。
- `catalog.json` 包含：source、tree、skills、exportRoot、version、生成时间。
- `skill.json` 包含：name/description/source/relPath/exportPath/metadata。

## Technical Considerations
- 复用现有 Markdown 解析/技能发现逻辑，避免重复实现。
- 若技能在子目录中，导出时复制该目录全部文件。
- 对远程技能使用 materializeSourceToTemp 后进行目录复制。
- 处理文件复制时保留相对路径结构。

## Success Metrics
- 对示例仓库（awesome-claude-skills）可生成可用技能目录树
- 导出目录结构清晰可读，技能完整可用

## Open Questions
- 是否需要额外支持只输出 JSON（不导出目录）？
- 是否需要生成可视化 HTML（非本期）？
