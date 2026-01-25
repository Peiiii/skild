# v0.7.19-complete-all-clarify

## 迭代完成说明
- 强化“完成所有/完成全部”必须发布闭环的约束，并明确无法发布时的阻塞处理要求
- Rulebook 增加 complete-all-release-required 规则

## 测试/验证/验收方式
- pnpm build（结果：通过）
- pnpm lint（结果：通过）
- pnpm typecheck（结果：通过）
- rg -n -- "完成所有" /Users/tongwenwen/Projects/Peiiii/skild/AGENTS.md（冒烟，结果：通过）

## 发布/部署方式
- 本次仅文档更新，无需发布/部署
