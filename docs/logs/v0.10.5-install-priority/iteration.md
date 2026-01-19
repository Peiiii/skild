# 2026-01-19 CLI 安装优先级与统计关闭

## 背景 / 问题

- 用户反馈 `skild install` 结束后会被下载统计请求卡住，体验差。
- 部分 GitHub 仓库根目录无 `SKILL.md`，但内部包含技能；之前优先走 README 解析，导致技能未被优先识别。

## 决策

- 默认关闭下载统计上报，需显式设置 `SKILD_ENABLE_STATS` 才发送。
- 远程源解析优先级调整为：materialize → 全仓扫描任意包含 `SKILL.md` 的目录 → README/Markdown 解析兜底。

## 变更内容

- CLI：`packages/cli/src/commands/install.ts`、`install-discovery.ts` 调整解析顺序，先找技能目录，再读 README。
- CLI：统计上报默认为关闭。
- 版本：发布 `skild@0.10.5`（patch）。

## 验证

```bash
# 构建 / Lint / 类型检查
pnpm release:check
```

验收点：
- `pnpm release:check` 通过（build + lint + typecheck）。
- 安装 GitHub 仓库且根无 `SKILL.md`，但子目录有时直接识别为技能目录，不再先走 README。
- 默认不触发下载统计请求，安装结束无额外卡顿。

## 发布 / 部署

```bash
pnpm release:version
pnpm release:publish
```

- npm：`skild@0.10.5` 已发布，自动打 tag `skild@0.10.5`。
- 无需额外前端/registry 部署。

## 影响范围 / 风险

- Breaking change：否（默认行为更安全）。
- 回滚：恢复旧版 npm 包或重新启用统计（设置 `SKILD_ENABLE_STATS=1`）。***
