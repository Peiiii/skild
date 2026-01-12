# 2026-01-12 CLI UX：`skild list` 默认列出所有平台

## 背景

多数用户并不知道自己在用的 Agent 属于哪个平台（Claude/Codex/Copilot），也不愿意为了 “看一下装了什么” 先研究 `-t` 参数。
这会把首次体验卡在概念层：用户还没理解 Skill 的价值，就先被“平台选择”劝退。

## 决策

把 `skild list` 的默认行为改成：

- **默认列出所有平台**（同一 scope：global 或 project）
- 仍然支持 `skild list -t <platform>` 精确过滤
- `--json` 在不指定 `-t` 时返回带 `platform/scope` 的列表（便于程序消费）
- 默认不列出隐藏目录（如 Codex 的 `.system`），避免干扰用户理解

## 实现

- `@skild/core` 新增 `listAllSkills({ scope })`，统一在 core 层实现跨平台聚合（避免 CLI 重复业务逻辑）
- `skild list`：
  - 未指定 `-t`：按平台分组展示
  - 指定 `-t`：保持原单平台输出
  - `list` 的 `-t` 不再设置默认值（否则永远无法触发“默认全平台”）

## 验证

轻量 smoke-check（验证默认行为 + 单平台过滤）：

```bash
pnpm cli install ./examples/hello-skill -t codex --local --force
pnpm cli list --local
pnpm cli list -t codex --local
```

验收点：

- `list --local`：输出包含 `codex (1)`，且能看到 `hello-skill`
- `list -t codex --local`：只列出 codex，数量正确

小提示：如果只想看 CLI 输出、不想看 pnpm 的脚本 banner，用 `pnpm -s cli ...`。

```bash
pnpm build
pnpm lint
pnpm typecheck
```
