# Show HN: Skild —— Agent Skills & Skillsets 的统一包管理

Hi HN，

我做了 **Skild**：一个开源的 CLI + registry，让不同 AI agent 平台的 skills 更容易被发现、安装和分享。项目已线上运行。

**为什么要做：** skills 正在成为基础能力，但各平台的安装路径和约定不统一。技能分散在 GitHub 仓库、子目录、精选列表与 registry 中，安装多是手动复制粘贴，难以复现。

**Skild 提供：**
- 一个统一的安装入口：GitHub / 简写 / registry / 本地目录
- 一条命令安装到单一平台或 **全部** 支持平台
- **Skillsets**：可组合、可分享的一键技能包
- Alias 安装（例如 `skild install superpowers`）
- 多技能仓库自动发现（`skills/*/SKILL.md`）
- CI 非交互安装（`--recursive`, `-y`）

**示例**
```bash
# GitHub URL 或简写
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
skild install anthropics/skills/skills/pdf

# 安装到单一平台或全部支持平台
skild install anthropics/skills/skills/pdf -t codex
skild install anthropics/skills/skills/pdf --all

# Alias 安装（需要已发布）
skild install superpowers

# 多技能仓库自动发现
skild install https://github.com/anthropics/skills --recursive

# 搜索、列表、验证
skild search pdf
skild list
skild validate ./path/to/skill

# 更新或卸载
skild update pdf
skild uninstall pdf

# 创建并发布技能
skild init my-skill
cd my-skill
skild login
skild publish --name my-skill 
skild install @yourhandle/my-skill
```

链接：
- 官网: https://skild.sh
- Hub（搜索/浏览）: https://hub.skild.sh
- GitHub: https://github.com/Peiiii/skild

很欢迎反馈：
- 你怎么看 “skillset” 这种技能包模式
- 理想的安装/更新工作流
- 还缺哪些原语（版本、锁定、lockfile、发现体验等）
