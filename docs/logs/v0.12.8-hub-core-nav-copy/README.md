# 2026-02-04 Hub Core Navigation + Copy Command

## 背景 / 问题

- Core Domains 页面缺少清晰导航与可复制的安装命令
- 顶部统计信息过于冗余，影响核心内容聚焦

## 决策

- 增加页面目录导航（锚点跳转）
- 为每个技能提供可复制的安装命令
- 移除顶部统计信息与领域计数展示

## 变更内容

- 新增导航目录与复制安装命令 UI
- 移除 Core 页面顶部统计卡片与领域计数

## 功能说明

- **目标**：提升 Core Domains 页面可扫读性与可操作性
- **输入**：点击目录跳转；点击复制按钮
- **输出**：跳转到对应领域；剪贴板中得到 `skild install ...`
- **默认策略与边界**：
  - 安装命令格式为 `skild install {repo}/{skillId}`
  - 复制成功后短暂提示 Copied

## 使用方式

```bash
# 示例 1：打开 Core 页面
open https://hub.skild.sh/core

# 示例 2：查看数据源
curl -fsS https://hub.skild.sh/data/skills-core-domains.json | head -n 5
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# smoke-check（非仓库目录）
tmpdir=$(mktemp -d) \
  && cp -R /Users/peiwang/Projects/skild/apps/console/dist "$tmpdir/dist" \
  && python3 -m http.server --directory "$tmpdir/dist" 8183 >/dev/null 2>&1 & pid=$! \
  && sleep 1 \
  && rg -n "On this page" "$tmpdir/dist" -g '*.js' \
  && rg -n "Install command" "$tmpdir/dist" -g '*.js' \
  && kill "$pid" \
  && rm -rf "$tmpdir"
```

验收点：

- 页面顶部展示目录导航
- 技能卡片显示安装命令与复制按钮

## 发布 / 部署

- 无（前端页面更新）

## 影响范围 / 风险

- Breaking change? 否
- 风险：无
- 回滚方式：移除新增导航与复制模块
