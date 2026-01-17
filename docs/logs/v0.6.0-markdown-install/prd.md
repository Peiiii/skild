# PRD：从 GitHub Markdown 递归发现并安装 Skills

## 背景
目前 `skild install` 主要支持 GitHub 仓库/目录的直接扫描（SKILL.md 或子目录包含 SKILL.md）。对于“awesome list / 指南类”仓库，需要用户手动找出每个 skill 链接再安装，效率低。

## 目标
- 支持从 GitHub Markdown 文档（README / 目录下 README / 直接指向 .md 文件）递归解析技能链接。
- 解析过程持续输出状态（文档数 / 链接数 / 技能数），降低等待焦虑。
- 解析结果以语义树结构展示（Markdown DOM 层级），并压缩单子节点层级。

## 非目标
- 不扩展到非 GitHub 域名（如 GitLab/Gitee）。
- 不做全文搜索或爬虫，仅基于 Markdown 链接递归解析。
- 不改变现有 install 的 registry / local 行为。

## 用户故事
- 作为使用者，我输入一个 GitHub awesome 列表链接时，希望自动解析并展示其中所有可安装技能，并按文档结构组织，便于理解和选择。

## 体验与交互
- 若输入链接能解析到 Markdown（直接文件或目录 README），进入 Markdown 解析流程。
- 解析期间持续更新进度提示：`Parsing markdown (X docs, Y links, Z skills)`。
- 解析完成后展示树形结构，支持交互选择安装。
- 如果本地无可解析的技能，仍保留原有安装逻辑提示。

## 成功标准
- 对 `https://github.com/ComposioHQ/awesome-claude-skills` 能解析出多个 skill 候选，并完成安装流程。
- 解析过程有实时进度提示，且树结构可读、层级简洁。
