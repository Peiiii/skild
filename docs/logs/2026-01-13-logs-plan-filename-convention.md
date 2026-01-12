# 2026-01-13 Logs：规划文档命名规范补充

## 背景 / 问题

- 随着规划文档变多，需要在目录里快速区分“规划（plan）”与“实现日志/复盘（log）”

## 决策

- 规划类文档文件名建议以 `.plan.md` 结尾（例如 `YYYY-MM-DD-xxx.plan.md`）

## 变更内容

- `docs/logs/TEMPLATE.md`：补充 `.plan.md` 命名建议
- `docs/logs/README.md`：补充 `.plan.md` 命名建议
- 重命名示例：
  - `docs/logs/v0.2.0-registry/2026-01-12-auth-npm-style-web-login.plan.md`

## 验证（怎么确认符合预期）

```bash
rg -n \"\\.plan\\.md\" docs/logs/README.md docs/logs/TEMPLATE.md
ls -la docs/logs/v0.2.0-registry | rg -n \"\\.plan\\.md\"
```

验收点：

- `docs/logs/README.md` 和 `docs/logs/TEMPLATE.md` 都能搜到 `.plan.md` 规范
- v0.2.0-registry 目录下的规划文档以 `.plan.md` 结尾

