# V2EX 推广帖 — Skillsets 功能发布

> 发布节点建议：`/go/create` 或 `/go/share`

---

## 标题

**[开源] skild 新功能：Skillsets — 一行命令给 AI Agent 装上完整工具包**

---

## 正文

各位 V 友好！

之前分享过 [skild](https://skild.sh)，一个专门为 AI Agent 设计的包管理器。最近又有了一些重要更新，来聊聊新功能 **Skillsets**。

### 🤔 遇到的问题

用 Claude Code / Codex 的朋友可能有这种体验：

> "我想让 AI 帮我做数据分析，但需要分别装 csv 处理、pandas 操作、SQL 查询... 每个 skill 都要单独安装，太麻烦了。"

### 🎁 Skillsets 来了

**Skillsets = 打包好的技能工具包**

一条命令，安装一整套相关技能：

```bash
# 安装"数据分析套件"—— 包含 csv, pandas, sql-helper 等
skild install @skild/data-analyst-pack

# 查看已安装的所有技能
skild list
```

就这样。你的 AI Agent 现在拥有了完整的数据分析能力。

### 🛠️ 自己也能创建 Skillsets

在 `SKILL.md` 里加几行：

```yaml
---
name: my-toolkit
skillset: true
dependencies:
  - @anthropic/csv
  - @skild/pandas
  - ./utils/my-helper
---
```

然后 `skild publish`，其他人就能用了。

### 🔗 相关链接

- 官网：https://skild.sh
- GitHub：https://github.com/Peiiii/skild
- 技能市场：https://hub.skild.sh/skillsets
- Skillsets 文档：https://github.com/Peiiii/skild/blob/main/docs/skillsets.md

---

开源项目，欢迎 Star ⭐ 欢迎反馈意见！

有任何问题或想法，可以直接在下面回复或者去 GitHub 提 issue。
