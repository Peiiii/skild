# 实现方案：Markdown 递归发现 Skills

## 核心策略
1. 识别 GitHub 来源（URL / shorthand），确定 repo + ref + path。
2. 入口若为 Markdown 文件或目录 README，则优先用 raw.githubusercontent.com 拉取内容并解析 Markdown AST（必要时回退本地 materialize）。
3. 在 AST 中按 Heading / ListItem 构建语义树，并递归处理链接：
   - 若链接指向 Markdown（.md / README），继续解析并挂载子树。
   - 否则当作 skill source，执行已有的 SKILL 发现逻辑。
4. 解析后对树做单子节点压缩，保留必要语义层级。

## 结构设计
- 新增 `markdown-discovery.ts`：包含 Markdown 解析、递归、去重、缓存、进度回调。
- 交互 UI 复用现有树选择，新增 `promptSkillsTreeInteractive` 接收预构建树。
- install pipeline 在 remote source 发现阶段优先尝试 Markdown 解析，成功则直接进入选择/安装。

## 关键算法
- Repo 级别缓存：同一 repo/ref 只 materialize 一次（用于读取 Markdown）。
- Skill 级别缓存：同一链接只解析一次，避免重复 materialize。
- 去重：同一 `suggestedSource` 只保留一个 skill。
- 递归深度：复用 `--depth`；最大候选数复用 `--max-skills`。

## 失败与回退
- Markdown 解析失败或未发现技能时，回退到原有安装发现逻辑。
- 链接无效 / materialize 失败时跳过，不中断整体流程。

## 性能与安全
- 限制递归深度和最大候选数，防止无限链路或过载。
- 仅解析 Markdown 链接，忽略 mailto / 外部非 GitHub 链接。
