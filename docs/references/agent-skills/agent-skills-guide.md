# Agent Skills 完整指南 | Complete Guide to Agent Skills

> **官方资源 | Official Resources:**
> - 官方网站: [agentskills.io](https://agentskills.io)
> - 规范文档: [agentskills.io/specification](https://agentskills.io/specification)
> - 官方示例: [github.com/anthropics/skills](https://github.com/anthropics/skills)
> - Anthropic 博客: [Equipping agents for the real world](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
> - 最佳实践: [platform.claude.com - Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

---

## 一、什么是 Agent Skills？ | What are Agent Skills?

**Agent Skills** 是 Anthropic 于 2025 年 10 月推出、12 月作为开放标准发布的一种**轻量级、开放的格式**，用于为 AI Agent 扩展专业知识和工作流能力。

### 核心定位 | Core Positioning

Skills 是组织好的**指令、脚本和资源文件夹**，Agent 可以动态发现和加载它们，以在特定任务上表现得更好。

**类比**: 构建一个 Skill 就像为新员工准备**入职指南**。你将自己的专业知识封装成可组合的资源，让通用 Agent 变成专业化 Agent。

### 与相关概念的区别 | Comparison with Related Concepts

| 概念 Concept | 作用 Purpose |
|--------------|--------------|
| **Tools / Function Calling** | Agent 可调用的单个原子操作 (Single atomic operations) |
| **MCP (Model Context Protocol)** | Agent 如何**连接**数据源和工具 (How agents *connect* to data/tools) |
| **Agent Skills** | Agent 如何**执行任务** — 封装程序性知识、指令和工作流 (How agents *execute tasks* — procedural knowledge) |

> **关系**: Skills 可以编排复杂任务，并指示 Agent 调用通过 MCP 或其他机制暴露的工具。Skills 和 MCP 是互补的。

---

## 二、Agent Skills 能做什么？ | What Can Agent Skills Enable?

1. **领域专业知识 (Domain Expertise)**: 将专业知识打包成可复用的指令，从法律审查流程到数据分析管道。
2. **新能力 (New Capabilities)**: 赋予 Agent 新能力（如创建演示文稿、构建 MCP 服务器、分析数据集）。
3. **可重复的工作流 (Repeatable Workflows)**: 将多步骤任务转化为一致、可审计的工作流。
4. **互操作性 (Interoperability)**: 相同的 Skill 可以跨不同的 Skills 兼容产品复用。

---

## 三、Skill 的结构 | Skill Structure

### 3.1 目录结构 | Directory Structure

一个 Skill 就是一个包含 `SKILL.md` 文件的目录：

```
my-skill/
├── SKILL.md         # 必需: 指令 + 元数据 (Required: instructions + metadata)
├── scripts/         # 可选: 可执行代码 (Optional: executable code)
├── references/      # 可选: 参考文档 (Optional: documentation)
└── assets/          # 可选: 模板、资源 (Optional: templates, resources)
```

### 3.2 SKILL.md 格式 | SKILL.md Format

```markdown
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(git:*) Bash(jq:*) Read
---

# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

## Quick start
Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Advanced features
**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
```

### 3.3 Frontmatter 字段 | Frontmatter Fields

| 字段 Field | 必需 Required | 说明 Description |
|------------|---------------|------------------|
| `name` | ✅ 是 | 1-64 字符，仅限小写字母、数字和连字符 `a-z`, `-`。不能以 `-` 开头/结尾，不能连续 `--`，必须与父目录名匹配 |
| `description` | ✅ 是 | 1-1024 字符，描述 Skill 做什么以及何时使用。用第三人称书写 |
| `license` | ❌ 否 | 指定 Skill 的许可证 |
| `compatibility` | ❌ 否 | 1-500 字符，描述环境要求（产品、系统包、网络访问等） |
| `metadata` | ❌ 否 | 字符串键值对映射，用于存储规范未定义的额外属性 |
| `allowed-tools` | ❌ 否 | 空格分隔的预批准工具列表（实验性） |

### 3.4 可选目录 | Optional Directories

| 目录 Directory | 用途 Purpose |
|----------------|--------------|
| `scripts/` | 可执行代码。应自包含或清晰记录依赖，包含有用的错误消息，优雅处理边缘情况 |
| `references/` | 参考文档，如 `REFERENCE.md`, `FORMS.md`, `finance.md` 等 |
| `assets/` | 模板（文档模板、配置模板）、图像（图表、示例）、数据文件（查找表、schema） |

---

## 四、工作原理 | How Skills Work

### 4.1 渐进式披露 (Progressive Disclosure)

这是 Agent Skills 的核心设计原则，使其灵活且可扩展。就像一本组织良好的手册，从目录开始，然后是具体章节，最后是详细附录。

**三个层级**：

| 层级 Level | 内容 Content | Token 预算 | 加载时机 |
|------------|--------------|------------|----------|
| **1. 元数据** | `name` + `description` | ~100 tokens | 启动时为所有 Skills 加载 |
| **2. 指令** | `SKILL.md` 完整正文 | <5000 tokens (推荐) | Skill 被激活时加载 |
| **3. 资源** | `scripts/`, `references/`, `assets/` 中的文件 | 按需 | 仅在需要时加载 |

### 4.2 工作流程 | Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Discovery (发现)                                                       │
│    Agent 启动时，只加载每个 Skill 的 name 和 description                   │
│    → 仅用于判断何时需要激活该 Skill                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. Activation (激活)                                                      │
│    当任务匹配某个 Skill 的描述时                                           │
│    → Agent 读取完整的 SKILL.md 指令到上下文                                │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. Execution (执行)                                                       │
│    Agent 遵循指令                                                         │
│    → 按需加载引用的文件或执行打包的代码                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 上下文窗口变化示意 | Context Window Changes

1. **初始状态**: 上下文包含核心系统提示 + 所有已安装 Skills 的元数据 + 用户消息
2. **触发 Skill**: Agent 调用工具读取 `pdf/SKILL.md` 的内容
3. **加载额外文件**: Agent 选择读取 Skill 中打包的 `forms.md`
4. **执行任务**: Agent 现在有了相关指令，继续处理用户任务

---

## 五、集成 Skills 到你的 Agent | Integrating Skills into Your Agent

### 5.1 集成概述 | Integration Overview

1. 在配置的目录中发现 Skills
2. 启动时加载元数据（name 和 description）
3. 将用户任务匹配到相关 Skills
4. 通过加载完整指令激活 Skills
5. 按需执行脚本和访问资源

### 5.2 Skill 发现 | Skill Discovery

扫描配置的目录，查找包含 `SKILL.md` 文件的子目录。

### 5.3 加载元数据 | Loading Metadata

```python
def parseMetadata(skillPath):
    content = readFile(skillPath + "/SKILL.md")
    frontmatter = extractYAMLFrontmatter(content)
    return {
        "name": frontmatter.name,
        "description": frontmatter.description,
        "path": skillPath
    }
```

### 5.4 注入到上下文 | Injecting into Context

将 Skills 元数据注入到系统提示中：

```xml
<available_skills>
  <skill>
    <name>pdf-processing</name>
    <description>Extracts text and tables from PDF files, fills forms, merges documents.</description>
    <location>/path/to/skills/pdf-processing/SKILL.md</location>
  </skill>
  <skill>
    <name>data-analysis</name>
    <description>Analyzes datasets, generates charts, and creates summary reports.</description>
    <location>/path/to/skills/data-analysis/SKILL.md</location>
  </skill>
</available_skills>
```

### 5.5 安全考虑 | Security Considerations

- **沙箱 (Sandboxing)**: 在隔离环境中运行脚本
- **白名单 (Allowlisting)**: 仅执行来自受信任 Skills 的脚本
- **确认 (Confirmation)**: 在运行潜在危险操作前询问用户
- **日志 (Logging)**: 记录所有脚本执行以供审计

### 5.6 验证 Skills | Validating Skills

使用官方参考库验证 Skills：

```bash
# 验证 Skill
skills-ref validate ./my-skill

# 生成 <available_skills> XML
skills-ref to-prompt ./my-skill ...
```

---

## 六、编写 Skills 的最佳实践 | Best Practices for Authoring Skills

### 6.1 核心原则 | Core Principles

#### 简洁是关键 (Concise is Key)

上下文窗口是公共资源。你的 Skill 与 Claude 需要的其他所有内容共享上下文窗口：
- 系统提示
- 对话历史
- 其他 Skills 的元数据
- 实际请求

**默认假设**: Claude 已经非常聪明。只添加 Claude 还不知道的上下文。质疑每条信息：
- "Claude 真的需要这个解释吗？"
- "我能假设 Claude 知道这个吗？"

**建议**: 保持 `SKILL.md` 正文在 500 行以内以获得最佳性能。

### 6.2 命名约定 | Naming Conventions

使用**动名词形式** (verb + -ing) 来命名 Skills：

**✅ 好的命名**:
- `processing-pdfs`
- `analyzing-spreadsheets`
- `managing-databases`
- `testing-code`
- `writing-documentation`

**✅ 可接受的替代**:
- 名词短语: `pdf-processing`, `spreadsheet-analysis`
- 动作导向: `process-pdfs`, `analyze-spreadsheets`

**❌ 避免**:
- 模糊名称: `helper`, `utils`, `tools`
- 过于通用: `documents`, `data`, `files`
- 保留词: `anthropic-helper`, `claude-tools`

### 6.3 编写有效的描述 | Writing Effective Descriptions

描述用于 Skill 发现，应包含 Skill 做什么**和**何时使用它。

**规则**:
- 始终使用**第三人称**
- 具体并包含关键词
- 每个 Skill 只有一个描述字段

**✅ 有效示例**:

```yaml
# PDF 处理
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# Excel 分析
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.

# Git 提交助手
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

**❌ 避免模糊描述**:
```yaml
description: Helps with documents
description: Processes data
description: Does stuff with files
```

### 6.4 渐进式披露模式 | Progressive Disclosure Patterns

#### 模式 1: 高层指南 + 引用

```markdown
---
name: pdf-processing
description: Extracts text and tables from PDF files...
---

# PDF Processing

## Quick start
Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Advanced features
**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
**Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

Claude 仅在需要时才加载 `FORMS.md`, `REFERENCE.md` 或 `EXAMPLES.md`。

#### 模式 2: 领域特定组织

```
bigquery-skill/
├── SKILL.md (概述和导航)
└── reference/
    ├── finance.md (收入、计费指标)
    ├── sales.md (机会、管道)
    ├── product.md (API 使用、功能)
    └── marketing.md (活动、归因)
```

### 6.5 工作流和反馈循环 | Workflows and Feedback Loops

对于复杂操作，将其分解为清晰的顺序步骤。提供 Claude 可以复制并勾选的检查表：

```markdown
## Research synthesis workflow

Copy this checklist and track your progress:
```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

**Step 1: Read all source documents**
Review each document in the `sources/` directory...

**Step 5: Verify citations**
Check that every claim references the correct source document.
If citations are incomplete, return to Step 3.
```

### 6.6 常见模式 | Common Patterns

#### 模板模式 (Template Pattern)

对于严格要求（如 API 响应或数据格式）：

```markdown
## Report structure
ALWAYS use this exact template structure:
```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```
```

#### 示例模式 (Examples Pattern)

提供输入/输出对，就像常规 prompting：

```markdown
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```
```

---

## 七、安全考虑 | Security Considerations

Skills 通过指令和代码为 Claude 提供新能力。虽然这使它们强大，但也意味着恶意 Skills 可能引入漏洞或指示 Claude 泄露数据。

**建议**:
1. 仅从**受信任来源**安装 Skills
2. 从不太受信任的来源安装时，使用前**彻底审计**
3. 阅读 Skill 中打包的文件内容，了解它做什么
4. 特别注意代码依赖和打包的资源（如图像或脚本）
5. 注意指示 Claude 连接到潜在不受信任的外部网络源的指令或代码

---

## 八、支持的平台 | Supported Platforms

Agent Skills 目前在以下平台支持：

| 平台 Platform | 使用方式 |
|---------------|----------|
| **Claude.ai** | 付费计划已内置示例 Skills。可上传自定义 Skills |
| **Claude Code** | 通过 `/plugin marketplace add anthropics/skills` 安装 Skills 市场 |
| **Claude Agent SDK** | 原生支持 |
| **Claude Developer Platform / API** | 通过 API 使用预构建 Skills 或上传自定义 Skills |

### Claude Code 快速开始

```bash
# 添加 Skills 市场
/plugin marketplace add anthropics/skills

# 安装特定 Skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

安装后，只需在对话中提及 Skill。例如：
> "Use the PDF skill to extract the form fields from path/to/some-file.pdf"

---

## 九、未来发展 | The Future of Skills

- 继续添加支持 Skills 完整生命周期的功能：创建、编辑、发现、共享和使用
- 探索 Skills 如何与 MCP 服务器互补，教 Agent 更复杂的涉及外部工具和软件的工作流
- 长远来看，希望让 Agent 能够自己创建、编辑和评估 Skills，将自己的行为模式编码成可复用的能力

---

## 十、官方示例 Skills | Official Example Skills

Anthropic 在 [github.com/anthropics/skills](https://github.com/anthropics/skills) 提供了丰富的示例：

### 文档类 (Document Skills)
- `docx` - Word 文档处理
- `pdf` - PDF 处理（支持 Claude 的文档编辑功能）
- `pptx` - PowerPoint 处理
- `xlsx` - Excel 处理

### 创意与设计 (Creative & Design)
- 艺术、音乐、设计相关 Skills

### 开发与技术 (Development & Technical)
- 测试 Web 应用
- MCP 服务器生成
- 代码审查

### 企业与沟通 (Enterprise & Communication)
- 通信工作流
- 品牌指南

### 合作伙伴 Skills (Partner Skills)
- [Notion Skills for Claude](https://www.notion.so/notiondevs/Notion-Skills-for-Claude-28da4445d27180c7af1df7d8615723d0)

---

## 十一、创建基础 Skill 模板 | Basic Skill Template

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it. Include specific keywords for discovery.
---

# My Skill Name

## When to use this skill
[Describe the scenarios where this skill should be activated]

## Quick start
[Provide the most common use case with minimal steps]

## Detailed instructions
[Step-by-step guidance for different operations]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2

## Troubleshooting
[Common issues and solutions]
```

---

## 十二、总结 | Summary

| 方面 Aspect | 说明 Description |
|-------------|------------------|
| **本质** | 文件夹 + `SKILL.md` = 可动态加载的专业知识包 |
| **格式** | YAML frontmatter + Markdown 内容 |
| **核心设计** | 渐进式披露 (Progressive Disclosure) |
| **与 Tools 的关系** | Skills 封装高级工作流，可调用底层 Tools |
| **与 MCP 的关系** | MCP 负责连接，Skills 负责执行任务。两者互补 |
| **可移植性** | 就是普通文件，易于版本控制和跨平台共享 |
| **开放标准** | 2025 年 12 月作为开放标准发布 |

---

*文档最后更新: 2026-01-06*
*基于 Anthropic 官方文档和 agentskills.io 规范整理*
