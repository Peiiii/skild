# Agent Skills 版 npm：Skild 一条命令装好整套技能，跨 Claude/Codex 同步

> 写给想快速了解 skild 的开发者和 AI 爱好者：它是什么、解决什么问题、为什么现在、怎么玩。

## 一句话定位

skild 是 Agent Skills 的包管理器，像 npm 之于前端包、Homebrew 之于工具，帮助你**发现、安装、管理、发布** AI Agent 的技能。

## 为什么需要 skild？

- 手动克隆仓库 + 复制文件，技能分发混乱，没有统一规范  
- 多平台（Claude、Codex、Copilot、Antigravity）各玩各的，技能难以同步  
- 缺少「市场」：不知道有哪些好用技能，更缺少评分和版本管理  
- 作者想发布技能，需要自己解决校验、版本、分发、推广的全链路

skild 把这些基础设施做好，让 Agent Skills 像装插件一样丝滑。

## 核心卖点

- **一键安装**：`skild install <source>` 支持 GitHub、Registry、本地目录  
- **多平台同步**：`skild sync` 自动发现缺失并一键补齐  
- **标准校验**：`skild validate` 保障 Skill 结构合规，减少踩坑  
- **Skillsets**：一次安装一组技能，团队环境快速拉齐  
- **发布闭环**：`skild publish`（Registry）+ `skild extract-github-skills`（批量收录）  
- **Hub 市场**：hub.skild.sh 搜索、安装、浏览精选技能

## 典型使用场景

- **个人效率**：给自己的 Agent 加上 pdf/xlsx/网页采集/数据分析等技能  
- **团队拉齐**：把常用技能整理成 Skillset，统一装到 Claude/Codex/Antigravity  
- **技能作者**：用 `skild init` 搭脚手架，`validate` 自测，通过 Registry 发布并获取分发/更新能力  
- **企业治理**：通过锁定文件与版本策略，控制技能来源、版本和安全性

## 3 分钟上手

```bash
# 1) 安装 skild CLI
npm i -g skild

# 2) 安装一个 Skillset（示例：anthropics/skills，一次装官方常用技能，格式是 GitHub 的 <username>/<repo>）
skild install anthropics/skills

# 3) 查看本地技能
skild list

# 4) 跨平台同步（示例：同步到 codex、cursor）
skild sync --to codex,cursor
```

更多例子见 `README.zh-CN.md` 与 `docs/getting-started.zh-CN.md`。

## 功能速览

| 类别 | 功能 | 命令 |
| --- | --- | --- |
| 安装管理 | 安装、卸载、更新、查看、锁定 | `install / uninstall / update / list / info` |
| 搜索发现 | 搜索技能 | `search` |
| 开发发布 | 创建、校验、发布 | `init / validate / publish` |
| 跨平台 | 多平台同步（可选指定目标） | `sync`（默认全平台），可选 `sync --to codex,cursor` |
| Skillsets | 套装一键安装 | `install <skillset> / uninstall --with-deps`（参见 docs/skillsets.zh-CN.md） |

## 进阶能力

- **Registry 账号与发布**：`skild signup`、`login`、`publish`  
- **GitHub 批量收录**：`skild extract-github-skills <source>`  
- **Web Hub**：hub.skild.sh 浏览、安装、评分（规划中）

## 生态与路线图（简版）

- MVP 已完成：安装/校验/列表/跨平台同步/创建脚手架  
- Registry 与 Hub 正在演进：搜索、评分、评论、私有技能  
- 即将增加：更丰富的 Skillset 模板、团队策略（允许/禁止列表）、安全扫描

## 适合谁用

- 想给 Agent 加能力的个人开发者/创作者  
- 想统一团队 Agent 技能栈的工程团队  
- 想发布并分发技能的作者/公司  
- 关注 Agent 安全与合规的企业用户

## 如何参与

- Star & 试用：GitHub `peiiii/skild`，npm `skild`  
- 贡献：提交 PR / 新增技能 / 改进文档  
- 反馈：GitHub Issues，或在知乎/社区留言

## 资料汇总

- 官网：skild.sh  
- Hub：hub.skild.sh  
- 仓库：github.com/Peiiii/skild  
- 文档索引：`docs/README.zh-CN.md`
