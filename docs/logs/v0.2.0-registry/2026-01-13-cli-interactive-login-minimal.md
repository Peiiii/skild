# 2026-01-13 CLI Auth：先对齐 npm 的最小交互范式（不做 Web/device flow）

## 背景 / 问题

- 现有 `skild signup/login` 主要依赖参数传入（`--password` 等），不符合 npm 的常见使用心智
- 用户担心“没登录就跑命令会卡住”（已在上一轮通过超时解决），但 login 本身也应避免把密码放到命令行参数里
- 当前阶段明确“不搞复杂”：暂不引入 Web/device code flow（未来再做）

## 决策

- `skild login` / `skild signup` 默认走 **交互式 CLI**（像 npm 一样在终端里输入）
- 非交互环境（CI/pipe）或 `--json` 模式下：必须显式传入必要参数，避免等待 stdin 导致卡住

## 变更内容

- `skild login`：
  - `--handle-or-email` / `--password` 变为可选；缺失时进入交互式 prompt
  - password 采用隐藏输入（不回显）
- `skild signup`：
  - `--email` / `--handle` / `--password` 变为可选；缺失时进入交互式 prompt
  - password 采用隐藏输入（不回显）
- 新增 prompt 工具：`packages/cli/src/utils/prompt.ts`

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# 交互式（应提示输入，不需要任何参数）
pnpm -s cli login
pnpm -s cli whoami

# 非交互/JSON（缺少参数应快速失败，不等待）
pnpm -s cli login --json
```

验收点：

- `skild login` 不传参数时会进入交互式输入（类似 npm）
- `--json` 或非交互环境缺少参数时不会卡住（直接报错退出）

