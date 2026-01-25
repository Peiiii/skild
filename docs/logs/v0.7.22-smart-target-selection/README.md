# v0.7.22-smart-target-selection

## 迭代完成说明
- update/uninstall 平台选择只展示已安装的平台
- scope 选择移动到最后一步，并仅展示有安装的 scope
- 对未安装目标自动跳过，避免误报错误

## 测试/验证/验收方式
- pnpm build（结果：通过）
- pnpm lint（结果：通过）
- pnpm typecheck（结果：通过）
- 冒烟：/tmp 下创建临时 skill，仅全局安装后执行 update（结果：通过）
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install <tmp-skill> --target claude --yes`
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js update smoke-skill --target claude --local --global`

## 发布/部署方式
- 本次为 CLI 逻辑更新，无需发布/部署
