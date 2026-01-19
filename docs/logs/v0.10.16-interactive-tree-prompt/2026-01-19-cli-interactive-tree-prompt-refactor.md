# 2026-01-19 CLI interactive tree prompt refactor

## 背景 / 问题

- 交互式树形选择（skills / platforms）属于高复杂度 TTY UI，历史上反复出现“长列表重复渲染 / 视口跳动 / 闪烁 / 日志丢失”等回归。
- 需要把这块能力解耦封装，做成可复用模块，隔离风险，便于后续扩展其它交互选择场景。

## 决策

- 把通用的 TTY session（alt screen + deferred exit）、viewport 渲染、选择状态机、日志队列、行内截断策略收敛到独立模块。
- 原 `interactive-select` 变成业务适配层（构树 + 业务文案 + 节点渲染参数），避免重复实现同一套 UI 逻辑。
- 导航到第一/最后一行时不做 wrap-around（继续按方向键保持在边界），避免长列表误操作导致“瞬间跳转迷失”。

## 变更内容

- 新增可复用模块：`packages/cli/src/ui/interactive-tree-prompt.ts`
  - `interactiveTreeSelect`：通用树形多选交互
  - `enqueuePostPromptLog` / `flushInteractiveUiNow`：交互后输出的可靠 flush（避免写进 alt screen 被覆盖）
  - `formatInteractiveRow`：优先截断描述/提示，最后才截断名称（中间省略）
- 业务适配层瘦身：`packages/cli/src/utils/interactive-select.ts`
- 交互导航行为：到边界不循环（up/down 不 wrap）

## 验证

```bash
# 快速自检（宽度截断等纯逻辑）
pnpm -C packages/cli selfcheck:ui

# 全量验证（build + lint + typecheck）
pnpm release:check
```

验收点：

- 长列表上下导航不会“跳回顶部/底部”造成迷失（到边界继续按方向键保持在边界）。
- 交互结束后的选中摘要/安装结果日志不会丢失或被覆盖。

## 发布 / 部署

本次为 npm 包发布（仅 packages/*，不含 registry/console/web 部署），遵循 `docs/processes/npm-release-process.md`：

```bash
pnpm release:version
pnpm release:publish

# 线上（npm）冒烟
npm view skild version
npm view @skild/core version
```

## 影响范围 / 风险

- Breaking change：否（交互行为更符合常见 TUI 的边界导航习惯）。
- 风险：CLI TTY 环境差异（不同终端/rows/cols）；已通过封装降低后续回归概率。

