# Logs

- `docs/logs/v0.0.1-mvp/README.md`
- `docs/logs/v0.1.0-headless/README.md`
- `docs/logs/v0.2.0-registry/README.md`
- `docs/logs/v0.12.0-skill-repo-push/README.md`
- `docs/logs/v0.12.1-homepage-skill-links/README.md`
- `docs/logs/v0.12.2-hub-skill-data/README.md`
- `docs/logs/v0.12.3-hub-skill-summaries/README.md`
- `docs/logs/v0.12.6-hub-console-core/README.md`
- `docs/logs/v0.12.7-hub-english-ui/README.md`
- `docs/logs/v0.12.8-hub-core-nav-copy/README.md`
- `docs/logs/v0.12.9-hub-core-default/README.md`
- `docs/logs/v0.12.10-skill-push-doc/README.md`
- `docs/logs/v0.12.11-default-push-repo/README.md`

## 写日志的标准

每次改动完成后新增一篇日志文件，至少包含：

- 做了什么（用户可见 + 关键实现点）
- 怎么验证（轻量 smoke-check + `build/lint/typecheck`）
- 怎么发布/部署（如果会影响 npm 包/线上环境；详细流程引用 `docs/release.md`）

模板：`docs/logs/TEMPLATE.md`

## 规划规则

- 规划文档禁止写具体花费时间/工期（例如“3 天”“1 周”）；只写里程碑顺序、交付物与验收标准。
- 规划类文档建议以 `.plan.md` 结尾（例如 `YYYY-MM-DD-xxx.plan.md`），便于区分“规划”与“实现/复盘”
