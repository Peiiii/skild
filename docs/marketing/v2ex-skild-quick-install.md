# [开源] Skild：给 Claude / Codex / Copilot / Antigravity 装 Skills 的“npm”

大家好，我最近做了一个开源工具：Skild。

目标很简单：把“给不同 AI Agent 安装 Skills”这件事，做成像 npm 一样简单、可复现、可组合的工作流。

仓库：https://github.com/Peiiii/skild  
官网：https://skild.sh  
Hub（搜索/查看）：https://hub.skild.sh

---

## 我们解决什么问题？

现在很多 IDE / Agent 都开始支持 skills（或类似概念），但现实是：

- 每个平台的 skills 目录不一样（Claude/Codex/Copilot/Antigravity）
- skills 的来源也不一样（GitHub 仓库、子目录、registry、以及 skillset 组合）
- 安装/更新/卸载缺乏统一工具链，容易乱、难复现

Skild 就是把这些“工程化”到一个 CLI 里。

---

## 这次想重点分享：快捷安装

### 1) 用短名 alias 安装（最像 npm）

如果某个 skill/skillset 在 registry 配置了 alias（全局唯一），用户可以直接：

```bash
skild install superpowers
```

不用记 `@publisher/name` 或者一长串 GitHub URL。

### 2) 多-skill 仓库一键安装（自动识别 + 交互确认）

很多仓库是这种结构：根目录没有 `SKILL.md`，但 `skills/*/SKILL.md` 下有很多技能（典型例子：anthropics/skills）。

现在你可以直接对仓库根安装：

```bash
skild install https://github.com/anthropics/skills
```

Skild 会列出发现的 skills，并询问你是否一键安装全部。

也支持非交互（CI/脚本）：

```bash
skild install https://github.com/anthropics/skills --recursive
# 或者：默认同意，跳过确认
skild install https://github.com/anthropics/skills -y
```

### 3) 一次装到所有平台

```bash
skild install anthropics/skills/skills/pdf --all
```

---

## 其它能力（顺带）

- `skild list`：更清晰地展示 skills / skillsets / dependencies
- `skild uninstall --with-deps`：卸载 skillset 时可连同其依赖一起清理
- `--json`：结构化输出，方便脚本/GUI 集成
- 支持 skillset：一个 skill 可以声明 dependencies，把多个 skills 组合成一键安装的“套装”

---

## 想请教 / 征求反馈

1) 你觉得“alias 短名安装”更适合做成 skill 的属性，还是独立实体？（我们目前是 skill 的属性）
2) 多-skill 仓库的一键安装，你更希望默认行为是：
   - 发现多个就提示确认（当前）
   - 发现多个就直接装（更激进）
3) 你希望 Skild 优先支持哪些平台/目录约定？（我们目前支持 Claude/Codex/Copilot/Antigravity）

如果你愿意试用，我很想听听真实使用场景下的痛点（尤其是团队内共享/复现安装这块）。

