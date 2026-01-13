# 发布你的 Skill

本指南介绍如何将你的 Skill 发布到 Skild，让其他用户可以安装使用。

---

## Step 1: 注册账号（仅首次）

```bash
skild signup
```

按提示输入邮箱、用户名、密码即可。

---

## Step 2: 登录

```bash
skild login
```

按提示输入账号密码。

---

## Step 3: 准备 Skill

在你的 Skill 目录中，确保有一个 `SKILL.md` 文件：

```markdown
---
name: my-skill
version: 1.0.0
description: 一句话介绍你的 Skill
---

# My Skill

给 AI Agent 的使用说明...
```

> **提示**：可以用 `skild init my-skill` 快速生成模板。

---

## Step 4: 发布

进入 Skill 目录，运行：

```bash
skild publish
```

就这样，发布完成！ 🎉

---

## Step 5: 安装测试

```bash
skild install @yourhandle/my-skill
```

---

## 进阶用法（可选）

| 场景 | 命令 |
|------|------|
| 指定目录发布 | `skild publish --dir ./path/to/skill` |
| 覆盖名称 | `skild publish --name my-new-name` |
| 覆盖版本 | `skild publish --skill-version 2.0.0` |
| 发布到 beta 标签 | `skild publish --tag beta` |

---

## 常用命令速查

```bash
skild signup      # 注册账号
skild login       # 登录
skild whoami      # 查看当前登录状态
skild init <name> # 创建新 Skill
skild validate    # 验证 Skill 结构
skild publish     # 发布
skild logout      # 登出
```
