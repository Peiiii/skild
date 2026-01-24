## 迭代：v0.7.8-install-skill-flag

### 改了什么
- CLI `install` 支持 `--skill <path-or-name>`，在多技能源（仓库/目录/Markdown 发现结果）里直接锁定单个技能，匹配规则覆盖相对路径、末级目录名、SKILL.md 中的 name 以及 registry 规范名，避免再走交互或 `--recursive`。
- JSON/非交互模式下新增未命中与歧义提示，返回可用列表或匹配项，便于 CI 场景快速失败。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：`pnpm --filter ./packages/cli start -- install https://github.com/anthropics/skills --skill pdf --target claude --yes --local --force` → 成功安装 `pdf` 至项目级 `.claude/skills/pdf`，无交互，输出成功提示。
- 冒烟清理：已移除仓库内的 `.claude/skills/pdf` 安装，并将冒烟规范更新为默认使用非仓库路径的环境。

### 发布/部署
- 组件：`packages/cli`、`packages/core`（npm 包）。
- 状态：已发布。执行 `pnpm release:version && pnpm release:publish` 完成版本号提升与发布，产出：
  - `skild@0.10.19`
  - `@skild/core@0.10.19`
  - Git tags：`skild@0.10.19`、`@skild/core@0.10.19`
