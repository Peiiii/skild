## 迭代：v0.7.13-one-shot-intro

### 改了什么
- 一次性展示版介绍文档移除 `search`，新增 `publish` 作为核心命令与推荐用法。
- 快速开始流程同步调整为 install -> publish(可选) -> update。
- 核心命令与用法顺序调整为 install -> list -> update -> uninstall -> sync -> publish。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：
```bash
cd /tmp
rg -n "publish" /Users/tongwenwen/Projects/Peiiii/skild/docs/marketing/one-shot-intro.zh-CN.md
! rg -n "search" /Users/tongwenwen/Projects/Peiiii/skild/docs/marketing/one-shot-intro.zh-CN.md
python3 - <<'PY'
from pathlib import Path
text = Path('/Users/tongwenwen/Projects/Peiiii/skild/docs/marketing/one-shot-intro.zh-CN.md').read_text(encoding='utf-8')
needle = ['`install`','`list`','`update`','`uninstall`','`sync`','`publish`']
positions = [text.find(n) for n in needle]
if any(p == -1 for p in positions): raise SystemExit('missing command')
if positions != sorted(positions): raise SystemExit('order mismatch')
print('SMOKE_ORDER_OK', positions)
PY
```
  观察点：文档包含 `publish` 且不包含 `search`，核心命令顺序一致。

### 发布/部署
- 无（仅文档调整）。
