# FAQ

常见问题解答。

---

## 安装问题

### Q: `skild: command not found`

确保已全局安装：

```bash
npm i -g skild
```

### Q: 安装 Skill 时权限错误

尝试使用 `--local` 安装到项目目录：

```bash
skild install @publisher/skill --local
```

### Q: 如何更新已安装的 Skill？

```bash
skild update skill-name
```

---

## 发布问题

### Q: 发布时提示 "Email not verified"

1. 登录 [hub.skild.sh](https://hub.skild.sh)
2. 进入 Settings
3. 点击发送验证邮件
4. 查收邮箱并点击验证链接

### Q: 如何更新已发布的 Skill？

1. 更新 SKILL.md 中的 `version` 字段
2. 重新发布：

```bash
skild publish --dir ./my-skill
```

### Q: 我忘记了密码怎么办？

目前暂不支持密码重置功能。请联系我们。

---

## 平台问题

### Q: 支持哪些 AI 平台？

| 平台 | 选项 | 全局路径 |
|------|------|----------|
| Claude | `-t claude` | `~/.claude/skills` |
| Codex | `-t codex` | `~/.codex/skills` |
| Copilot | `-t copilot` | `~/.github/skills` |

### Q: 如何切换安装目标平台？

```bash
skild install @publisher/skill -t codex
```

---

## 其他

### Q: skild 是开源的吗？

是的！MIT 协议：[github.com/Peiiii/skild](https://github.com/Peiiii/skild)

### Q: 如何贡献？

- **提交 Issue**：报告 bug 或建议功能
- **提交 PR**：修复问题或添加功能
- **收录 Skill**：在 Catalog 中提交优质 GitHub Skills

### Q: 有问题如何联系？

- GitHub Issues: [github.com/Peiiii/skild/issues](https://github.com/Peiiii/skild/issues)
