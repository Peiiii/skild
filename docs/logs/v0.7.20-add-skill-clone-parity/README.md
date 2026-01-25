# v0.7.20-add-skill-clone-parity

## 迭代完成说明
- skild install 远程拉取改为优先走 git clone（与 add-skill 一致）
- git clone 失败时回退到 degit 路径，保留兼容性
- 补充 GitHub/GitLab/tree/subpath 与 shorthand 的 git 解析逻辑

## 测试/验证/验收方式
- pnpm build（结果：通过）
- pnpm lint（结果：通过）
- pnpm typecheck（结果：通过）
- 冒烟：/tmp 下使用 GitHub 公共 repo 进行 install，验证 git clone 路径可用（结果：通过）
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install https://github.com/anthropics/skills/tree/main/skills/pdf --target claude --yes`

## 发布/部署方式
- 本次为 CLI/Core 行为改动；如需对外生效需按 `docs/processes/npm-release-process.md` 发布
