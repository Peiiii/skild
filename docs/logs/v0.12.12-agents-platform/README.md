# 2026-02-05 Agents Platform Support

## 背景 / 问题

- 需要支持共享的 `.agents/skills` 路径体系
- 现有平台列表缺少 `agents`，CLI/UI/文档不一致

## 决策

- 新增平台标识 `agents`
- 全局路径为 `~/.agents/skills`，项目路径为 `./.agents/skills`
- 同步更新 CLI、UI 与文档中的平台清单

## 变更内容

- Core 新增 `agents` 平台与路径解析
- CLI 平台展示与交互选择加入 `agents`
- Web/Console 文案补齐 `Agents`
- 文档平台表与描述同步更新

## 功能说明

- 目标/范围：支持 `agents` 平台安装与同步路径
- 输入：`-t agents` 或 `--all`（包含 `agents`）
- 输出：安装/列出/同步时包含 `.agents/skills` 路径
- 默认策略与边界：
  - `agents` 与其他平台一致，支持 global/project scope
  - 平台顺序由 `PLATFORMS` 定义

## 使用方式

```bash
# 安装到 agents（全局）
skild install anthropics/skills/skills/pdf -t agents

# 项目级安装
skild install anthropics/skills/skills/pdf -t agents --local
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

tmpdir="$(mktemp -d)"
SKILD_HOME="$tmpdir/home" node /Users/peiwang/Projects/skild/packages/cli/dist/index.js list --target agents --json
```

验收点：

- `pnpm build/lint/typecheck` 无报错
- `skild list --target agents --json` 能正常执行且无报错

## 发布 / 部署

无。

## 影响范围 / 风险

- Breaking change? 否（新增平台）
- 回滚方式：移除 `agents` 平台与路径映射
