# v0.7.17-update-uninstall-targets

## 迭代完成说明
- update/uninstall 增加交互式平台选择（默认全选）
- update/uninstall 增加 local/global 作用域选择（默认全选）
- 复用目标选择逻辑，避免重复实现

## 测试/验证/验收方式
- pnpm build（结果：通过）
- pnpm lint（结果：通过）
- pnpm typecheck（结果：通过）
- 冒烟：在 /tmp 目录创建临时 skill，完成 install -> update -> uninstall（结果：通过）
  - `/tmp` 下创建临时目录与 `SKILL.md`
  - `node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install <temp-skill> --target claude --local`
  - `SKILD_HOME=<temp-home> node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install <temp-skill> --target claude`
  - `SKILD_HOME=<temp-home> node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js update smoke-skill --target claude --local --global`
  - `SKILD_HOME=<temp-home> node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js uninstall smoke-skill --target claude --local --global`

## 发布/部署方式
- 本次为 CLI 逻辑与文档更新，无需发布/部署
