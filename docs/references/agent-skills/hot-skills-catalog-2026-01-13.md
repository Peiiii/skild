# 2026-01-13 市面热门 Agent Skills 清单（第一版）

> 目标：用“可立即上架/可立即搬运”的粒度，把当前最有热度/信号的 Agent Skills（以带 `SKILL.md` 的技能包为准）整理成可运营的 catalog，便于我们快速引入供给侧并做平台化分发。

## 口径 / 说明

- 本清单聚焦 **AgentSkills 标准的 Skill 包**（目录内有 `SKILL.md`）。
- “热度”优先参考：
  - 官方生态（Anthropic 官方 Skills）
  - GitHub 信号（stars/活跃度/被引用）
  - 是否满足“通用 Agent 的高频需求”（文档、Web、测试、规划、MCP、部署等）
- “入口”指：用户/Agent 如何触发使用该 Skill（通常是 **Skill 名称** + 触发场景关键字）。
- 本项目（Skild）的“上架入口”当前还在建设中：这里给出 **建议的 skild 包名**（用于后续抢占命名空间与导入计划）。

## 数据源（可追溯）

- Anthropic 官方 Skills（source repo）：`https://github.com/anthropics/skills`（~39k⭐）
- Awesome Agent Skills（社区 curated）：`https://github.com/littleben/awesomeAgentskills`（~85⭐）
- 社区单体技能（示例）：
  - ExecPlan：`https://github.com/tiann/execplan-skill`（~23⭐）
  - MCP Progressive Client：`https://github.com/cablate/mcp-progressive-agentskill`（~15⭐）
  - Ask Questions：`https://github.com/the-vampiire/ask-questions-skill`（~2⭐）

## 使用入口（通用）

> 不同 Agent 产品对“安装/加载”目录的约定不同；但入口本质一致：把 Skill 文件夹放进可发现位置，然后在 prompt 中触发（提到 Skill 名称/符合触发场景）。

- Claude Code：复制 Skill 目录到 `.claude/skills/<skill>/`，在 prompt 中提及 Skill 名称或触发场景
- Codex CLI：复制 Skill 目录到 `.codex/skills/<skill>/`，在 prompt 中提及 Skill 名称或触发场景

---

## A) 官方热门（Anthropic / `anthropics/skills`）

> 这些是目前“最接近事实标准”的官方参考实现，适合作为 Skild 的第一批“高质量官方供给”。

### `algorithmic-art`
- 分类：Creative / Generative Art
- 入口：`algorithmic-art`
- 介绍：Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Repo：`https://github.com/anthropics/skills`
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/algorithmic-art`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md`
- 标签：generative-art, p5js, visualization, creative-coding
- 建议 skild 包名：`@anthropic/algorithmic-art`

### `brand-guidelines`
- 分类：Enterprise / Brand
- 入口：`brand-guidelines`
- 介绍：Applies Anthropic's official brand colors and typography to artifacts. Use when brand colors or style guidelines, visual formatting, or company design standards apply.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/brand-guidelines`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md`
- 标签：brand, typography, design-system, guidelines
- 建议 skild 包名：`@anthropic/brand-guidelines`

### `canvas-design`
- 分类：Creative / Design
- 入口：`canvas-design`
- 介绍：Create beautiful visual art in .png and .pdf documents using design philosophy. Use when the user asks to create a poster, piece of art, design, or other static piece.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/canvas-design`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/canvas-design/SKILL.md`
- 标签：poster, layout, print, pdf, design
- 建议 skild 包名：`@anthropic/canvas-design`

### `doc-coauthoring`
- 分类：Writing / Documentation
- 入口：`doc-coauthoring`
- 介绍：Guide users through a structured workflow for co-authoring documentation (proposals, specs, decision docs). Trigger when user mentions writing docs, drafting specs, or similar.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/doc-coauthoring/SKILL.md`
- 标签：docs, spec, proposal, decision-record
- 建议 skild 包名：`@anthropic/doc-coauthoring`

### `docx`
- 分类：Documents / Office
- 入口：`docx`
- 介绍：Comprehensive document creation, editing, and analysis for `.docx` (tracked changes/comments/formatting/text extraction).
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/docx`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/docx/SKILL.md`
- 标签：docx, word, tracked-changes, comments
- 建议 skild 包名：`@anthropic/docx`

### `frontend-design`
- 分类：Dev / Frontend / UI
- 入口：`frontend-design`
- 介绍：Create distinctive, production-grade frontend interfaces. Use when building web components/pages/apps or when styling/beautifying web UI.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/frontend-design`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md`
- 标签：ui, ux, react, css, design
- 建议 skild 包名：`@anthropic/frontend-design`

### `internal-comms`
- 分类：Enterprise / Communication
- 入口：`internal-comms`
- 介绍：Resources to write internal communications (status reports, leadership updates, newsletters, FAQs, incident reports, etc.).
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/internal-comms`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/internal-comms/SKILL.md`
- 标签：status-report, incident, newsletter, comms
- 建议 skild 包名：`@anthropic/internal-comms`

### `mcp-builder`
- 分类：Meta / MCP / Tooling
- 入口：`mcp-builder`
- 介绍：Guide for creating high-quality MCP servers (Python FastMCP / Node TS MCP SDK). Use when building MCP servers to integrate external APIs/services.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/mcp-builder`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md`
- 标签：mcp, tool-design, api-integration, server
- 建议 skild 包名：`@anthropic/mcp-builder`

### `pdf`
- 分类：Documents / Data Processing
- 入口：`pdf`
- 介绍：Comprehensive PDF manipulation toolkit for extracting text/tables, creating PDFs, merge/split, and handling forms.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/pdf`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md`
- 标签：pdf, extraction, tables, forms, ocr
- 建议 skild 包名：`@anthropic/pdf`

### `pptx`
- 分类：Documents / Office
- 入口：`pptx`
- 介绍：Presentation creation, editing, and analysis for `.pptx` (layouts, speaker notes, comments).
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/pptx`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/pptx/SKILL.md`
- 标签：pptx, slides, deck, presentation
- 建议 skild 包名：`@anthropic/pptx`

### `skill-creator`
- 分类：Meta / Skill Authoring
- 入口：`skill-creator`
- 介绍：Guide for creating effective skills. Use when users want to create/update a skill (knowledge/workflows/tool integrations).
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/skill-creator`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md`
- 标签：skill-authoring, workflow, templates
- 建议 skild 包名：`@anthropic/skill-creator`

### `slack-gif-creator`
- 分类：Creative / Media
- 入口：`slack-gif-creator`
- 介绍：Knowledge/utilities for creating animated GIFs optimized for Slack. Use when users request GIFs for Slack.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/slack-gif-creator/SKILL.md`
- 标签：gif, animation, slack, media
- 建议 skild 包名：`@anthropic/slack-gif-creator`

### `theme-factory`
- 分类：Design / Theming
- 入口：`theme-factory`
- 介绍：Toolkit for styling artifacts with a theme (slides/docs/reports/HTML). Includes preset themes + generate new theme.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/theme-factory`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/theme-factory/SKILL.md`
- 标签：theme, design-system, branding
- 建议 skild 包名：`@anthropic/theme-factory`

### `web-artifacts-builder`
- 分类：Dev / Web / Artifacts
- 入口：`web-artifacts-builder`
- 介绍：Suite of tools for creating elaborate multi-component HTML artifacts (React/Tailwind/shadcn/ui). Use for complex artifacts requiring state/routing/components.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/web-artifacts-builder/SKILL.md`
- 标签：react, tailwind, shadcn, ui, artifacts
- 建议 skild 包名：`@anthropic/web-artifacts-builder`

### `webapp-testing`
- 分类：Dev / QA / E2E
- 入口：`webapp-testing`
- 介绍：Toolkit for interacting with and testing local web apps using Playwright (verify UI, debug behavior, screenshots, logs).
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/webapp-testing`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md`
- 标签：playwright, e2e, testing, browser
- 建议 skild 包名：`@anthropic/webapp-testing`

### `xlsx`
- 分类：Documents / Data Analysis
- 入口：`xlsx`
- 介绍：Comprehensive spreadsheet creation/editing/analysis with formulas/formatting/visualization for `.xlsx/.csv/.tsv`.
- 来源/作者：Anthropic（官方）
- 相关链接：
  - Skill：`https://github.com/anthropics/skills/tree/main/skills/xlsx`
  - SKILL.md：`https://raw.githubusercontent.com/anthropics/skills/main/skills/xlsx/SKILL.md`
- 标签：xlsx, spreadsheet, formulas, analytics
- 建议 skild 包名：`@anthropic/xlsx`

---

## B) 社区高频/高信号（单体 Skill 仓库）

### `execplan`（ExecPlan）
- 分类：Dev / Planning / Delivery
- 入口：`execplan`
- 介绍：When writing complex features or significant refactors or user ask explicitly, use an ExecPlan from design to implementation.
- 来源/作者：`tiann/execplan-skill`
- 相关链接：
  - Repo：`https://github.com/tiann/execplan-skill`
  - SKILL.md：`https://raw.githubusercontent.com/tiann/execplan-skill/main/SKILL.md`
- 标签：planning, execution-plan, long-running, engineering
- 建议 skild 包名：`@tiann/execplan`

### `ask-questions`（Asking Effective Questions）
- 分类：Planning / Requirements
- 入口：`ask-questions`
- 介绍：Provides guidance for crafting effective user questions during planning or clarification; avoids generic questions and provides options with tradeoffs.
- 来源/作者：`the-vampiire/ask-questions-skill`（metadata.author: `obsessed-devs`）
- 相关链接：
  - Repo：`https://github.com/the-vampiire/ask-questions-skill`
  - SKILL.md：`https://raw.githubusercontent.com/the-vampiire/ask-questions-skill/master/ask-questions/SKILL.md`
- 标签：requirements, clarification, decision-making, planning
- 建议 skild 包名：`@obsessed-devs/ask-questions`

### `mcp-progressive-client`（Progressive MCP Client）
- 分类：MCP / Tooling / Infra
- 入口：`mcp-progressive-client`
- 介绍：Progressive MCP client with daemon architecture for persistent connections + three-layer progressive disclosure (metadata → tool list → schema).
- 来源/作者：`cablate/mcp-progressive-agentskill`
- 相关链接：
  - Repo：`https://github.com/cablate/mcp-progressive-agentskill`
  - SKILL.md：`https://raw.githubusercontent.com/cablate/mcp-progressive-agentskill/master/SKILL.md`
- 标签：mcp, daemon, tool-discovery, progressive-disclosure
- 建议 skild 包名：`@cablate/mcp-progressive-client`

---

## C) 社区 curated（Awesome Agent Skills / `littleben/awesomeAgentskills`）

> 这组技能的“内容质量/实用性”信号强，但部分 `name` 字段不符合 AgentSkills 规范（包含空格/大写）。如果要上架到 skild registry，建议先做一次标准化（如 kebab-case）。

### `shipany`
- 分类：Dev / Framework Docs
- 入口：`shipany`
- 介绍：Shipany AI-powered SaaS boilerplate documentation. Use when working with Shipany framework, Next.js 15, TypeScript, Drizzle ORM, NextAuth, payment integration, or building SaaS applications.
- 来源/作者：`littleben/awesomeAgentskills`
- 相关链接：
  - Repo：`https://github.com/littleben/awesomeAgentskills`
  - SKILL.md：`https://raw.githubusercontent.com/littleben/awesomeAgentskills/main/shipany/SKILL.md`
- 标签：nextjs, drizzle, nextauth, saas, docs
- 建议 skild 包名：`@littleben/shipany`

### `Deploying to Production`（建议标准化：`deploying-to-production`）
- 分类：Dev / Deployment
- 入口：`Deploying to Production`
- 介绍：Automates GitHub repository creation and Vercel deployment for Next.js websites (CI/CD, go live).
- 来源/作者：`littleben/awesomeAgentskills`
- 相关链接：
  - SKILL.md：`https://raw.githubusercontent.com/littleben/awesomeAgentskills/main/deploying-to-production/SKILL.md`
- 标签：vercel, github, deployment, cicd, nextjs
- 建议 skild 包名：`@littleben/deploying-to-production`

### `Internationalizing Websites`（建议标准化：`internationalizing-websites`）
- 分类：Dev / i18n / SEO
- 入口：`Internationalizing Websites`
- 介绍：Adds multi-language support to Next.js with SEO config (hreflang, localized sitemaps, localized content).
- 来源/作者：`littleben/awesomeAgentskills`
- 相关链接：
  - SKILL.md：`https://raw.githubusercontent.com/littleben/awesomeAgentskills/main/internationalizing-websites/SKILL.md`
- 标签：i18n, localization, next-intl, seo
- 建议 skild 包名：`@littleben/internationalizing-websites`

### `doc-sync-tool`
- 分类：Meta / Docs Ops
- 入口：`doc-sync-tool`
- 介绍：自动同步项目中的 Agents.md、claude.md 和 gemini.md 文件，保持内容一致性（支持监听/手动触发）。
- 来源/作者：`littleben/awesomeAgentskills`
- 相关链接：
  - SKILL.md：`https://raw.githubusercontent.com/littleben/awesomeAgentskills/main/doc-sync-tool/SKILL.md`
- 标签：docs, sync, automation, agent-config
- 建议 skild 包名：`@littleben/doc-sync-tool`

### `google-official-seo-guide`
- 分类：SEO / Reference
- 入口：`google-official-seo-guide`
- 介绍：Official Google SEO guide covering search optimization, best practices, Search Console, crawling, indexing, and improving search visibility.
- 来源/作者：`littleben/awesomeAgentskills`
- 相关链接：
  - SKILL.md：`https://raw.githubusercontent.com/littleben/awesomeAgentskills/main/google-official-seo-guide/SKILL.md`
- 标签：seo, google, search-console, indexing
- 建议 skild 包名：`@littleben/google-official-seo-guide`

