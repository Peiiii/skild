## 迭代：v0.7.2-sync-command

### 改了什么
- CLI 新增 `skild sync` 命令，可将源平台已安装的 skills 同步到其他平台，支持指定技能列表、目标平台、JSON 输出、强制覆盖，默认复用本地已安装内容（非 registry 场景）保证一致性。
- 更新命令参考与使用文档（中英文、skills/skild/commands.md、commands/commands.md），纳入 sync 工作流。

### 验证/验收
- ✅ `pnpm lint`
- ✅ `pnpm typecheck`
- ✅ `pnpm build`
- 冒烟：`node packages/cli/dist/index.js sync --help`（确认命令可用且展示新选项）

### 发布/部署
- 无后端/数据库变更。
- 未触发 npm 发布。如需发布 CLI，请按 `docs/processes/npm-release-process.md` 执行。
