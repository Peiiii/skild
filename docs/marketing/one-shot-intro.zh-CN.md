# Skild：只给你一次介绍，我会这样说

## 一句话
Skild 是「AI Skills 的 npm」——用一条命令安装、更新并发布各平台的 AI 能力。

## 30 秒理解
- 你只需要记住一个命令行：`skild`
- 它统一了技能的安装、管理、更新与发布
- 跨平台适配：Claude / Codex / Copilot / Cursor / Windsurf / OpenCode / Antigravity

## 1 分钟开始
```bash
# 1) 安装官方/热门技能（默认 Claude）
skild install anthropics/skills
# 1.1) 从多技能仓库精确安装单个技能
skild install anthropics/skills --skill pdf

# 2) 查看已安装技能
skild list

# 3) 一行更新所有已安装技能
skild update
```

## 6 个最核心命令（一级命令）
- `install`：获取并安装技能
- `list`：查看已安装
- `update`：更新全部技能
- `uninstall`：卸载技能
- `sync`：跨平台补齐
- `publish`：发布技能

## 最推荐的最短用法
```bash
skild install anthropics/skills
skild list
skild update
skild uninstall pdf
skild sync
skild publish --dir ./my-skill
```

## 你会在哪些场景用到它
1) 快速把常用能力装到你的 AI 工具里
2) 团队统一一套技能包，减少环境不一致
3) 多平台协作时，一键补齐缺失的技能

## 发布者的一句话
如果你是能力提供方，发布也很简单：
```bash
skild publish --dir ./my-skill
```

## 为什么值得信任
- 版本化、可追踪、可回滚
- 统一命名与依赖规则
- 本地记录不绑定设备路径，适合多人协作

## 下一步
- 快速开始：`skild install anthropics/skills`
- 完整文档：`docs/overview.zh-CN.md`
