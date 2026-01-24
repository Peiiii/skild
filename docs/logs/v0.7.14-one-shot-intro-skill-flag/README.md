## 迭代：v0.7.14-one-shot-intro-skill-flag

### 改了什么
- 一次性介绍文档补充 `skild install ... --skill` 的精确安装示例。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：
```bash
cd /tmp
rg -n -- "--skill" /Users/tongwenwen/Projects/Peiiii/skild/docs/marketing/one-shot-intro.zh-CN.md
```
  观察点：文档包含 `--skill` 的安装示例。

### 发布/部署
- 无（仅文档调整）。
