# v0.1.0 V2EX 发布帖

---

# skild — Agent Skills 的包管理器

2 个晚上做了个一键安装 Agent Skills 的命令行工具，当前为 MVP 版本，欢迎使用和反馈。

## 安装

```bash
npm i -g skild
```

## 安装技能

```bash
# 从 GitHub 安装（degit shorthand）
skild install anthropics/skills/skills/pdf

# 从完整 URL 安装
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 从本地目录安装
skild install ./my-skill

# 强制覆盖已有技能
skild install anthropics/skills/skills/pdf --force
```

## 多平台支持

默认安装到 Claude（`~/.claude/skills`），也支持 Codex 和 Copilot：

```bash
# 安装到 Codex（全局）
skild install anthropics/skills/skills/pdf -t codex

# 安装到 Codex（项目级别）
skild install anthropics/skills/skills/pdf -t codex --local
```

## 管理功能

```bash
# 查看已安装的技能
skild list

# 查看技能详情
skild info pdf

# 验证技能结构
skild validate pdf

# 更新技能
skild update pdf

# 卸载技能
skild uninstall pdf
```

## 创建新技能

```bash
skild init my-skill
cd my-skill
skild validate .
```

## 链接

- 官网：https://skild.sh
- GitHub：https://github.com/Peiiii/skild

---

欢迎试用，有问题可以直接回帖或者提 issue。
