# Show HN: Skild – AI Agent 技能领域的 npm

Hi HN,

我做了 **Skild**，一个开源的 CLI 工具，旨在简化 AI Agent 技能（Skills）的发现、管理和分享流程。

**痛点 (The Problem)：**
AI Agent 的“技能”（包括工具、知识库、函数等）正成为一种基础原语。然而，目前每个平台（如 Claude Desktop, Codex, Copilot, Antigravity 等）都有自己独特的目录结构、文件约定和繁琐的手动安装步骤。我发现自己经常需要跨机器手动将各种类似 MCP 的脚本和工具拷贝到不同的 Agent 目录中，这种感觉就像是在包管理器出现之前手动管理各种库文件一样原始。

**解决方案 (The Solution)：**
Skild 为 Agent 技能带来了统一的包管理工作流。你可以把它理解为 AI 生态中的 npm。

**核心特性：**
- **统一工作流**：支持从 GitHub URL、仓库简写、Skild Registry 或本地目录安装。
- **多平台支持**：一条命令即可安装到特定 Agent 或同时安装到所有支持的平台 (`--all`)。
- **Skillsets (技能包)**：这是我最喜欢的部分——你可以将一组相关的技能打包成一个 "Skillset"（例如：包含 TDD、调试、代码审查等开发工具的 "superpowers" 包），实现一键装备。
- **自动发现**：内置搜索和递归扫描功能，可以自动发现嵌套仓库结构中的所有技能。

**快速演示 (Quick Demo)：**

```bash
# 通过 GitHub URL 或简写安装
skild install https://github.com/anthropics/skills/tree/main/skills/xlsx
skild install anthropics/skills/skills/pdf

# 一键安装到所有支持的平台 (Claude, Codex, Antigravity 等)
skild install pdf --all

# 安装精选技能包 (Skillset)
skild install superpowers  # 一键安装 14+ 个开发辅助技能

# 递归发现并安装整个仓库中的所有技能
skild install https://github.com/anthropics/skills --recursive

# 搜索、列表与验证
skild search pdf
skild list
skild validate ./path/to/skill

# 创建并发布你自己的技能
skild init my-skill
skild publish --alias my-cool-tool
```

**相关链接：**
- 官网: https://skild.sh
- Hub (Web UI): https://hub.skild.sh
- GitHub: https://github.com/Peiiii/skild (MIT License)

**期待大家的反馈：**
- "Skillset"（技能包）这种模式是否契合你的 Agent 使用流？
- 你觉得目前还缺少哪些核心功能？（例如版本锁定 lockfile、更强的发现体验等）
- 你现在是如何管理你的 Agent 技能工具的？

我将在这里回答大家的任何问题！
