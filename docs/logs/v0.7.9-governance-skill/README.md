## 迭代：v0.7.9-governance-skill

### 改了什么
- 新增可复用的治理体系 Skill：`skills/project-os`，内含 AGENTS/commands/logs/release 模板，支持跨项目快速落地。
- 优化 project-os 描述，强调 AI 项目操作系统的自治治理与自动化愿景。
- 补充 project-os 三段式定位：自治闭环 / 自动化编排 / 规则驱动执行。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：`pnpm --filter ./packages/cli start -- validate /var/folders/hr/g7fkvnfx277dtmj2ycn6_gm80000gn/T/tmp.8hdeMFrJ/project-os`（非仓库路径）→ 输出 `Valid skill`（name: project-os）。

### 发布/部署
- 组件：无（仅新增 Skill 模板文件）。
- 状态：无需发布。
