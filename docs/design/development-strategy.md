# Skild 开发策略 | Development Strategy

> 本文档记录项目的核心战略思想和开发理念，供团队成员和 AI 协作者理解和遵循。

---

## 核心理念

### 1. 宣传先行 (Marketing First)

**传统方式**:
```
开发功能 → 发布 → 宣传 → 等用户
```

**我们的方式**:
```
Landing Page → 收集兴趣 → 边开发边推广 → 用户提前预热
```

**原因**: 宣传是最难的。先让 skild.sh 上线，收集早期用户兴趣，同时继续开发 CLI。这是更聪明的 GTM (Go-To-Market) 策略。

### 2. 快节奏开发 (Rapid Development)

- 不追求完美，追求快速验证
- 先上线，再迭代
- 用户反馈驱动功能优先级

### 3. 面向未来 (Future-Oriented)

- 设计时考虑扩展性
- 但不过度设计当前不需要的功能
- 保持代码简洁，易于修改

---

## 当前阶段优先级

### Phase 0: 宣传落地 (当前)

1. **Landing Page** — skild.sh 上线
   - 部署到 Cloudflare Pages
   - 包含 Waitlist 收集邮箱
   - 展示产品愿景和功能预览

2. **社区宣传**
   - Twitter/X 发布
   - Hacker News / Reddit
   - 中文社区 (V2EX, 掘金等)

### Phase 1: MVP 开发

在有用户基础后，再开发核心功能：
- `skild install <git-url>`
- `skild init`
- `skild validate`
- `skild list`

---

## 技术决策原则

1. **简单优先** — 能用简单方案解决的，不用复杂方案
2. **快速部署** — 选择部署最快的技术栈
3. **低成本** — 初期尽量使用免费服务 (Cloudflare, GitHub)

---

## 部署策略

| 组件 | 部署平台 | 原因 |
|------|----------|------|
| Landing Page | Cloudflare Pages | 免费、全球 CDN、秒级部署 |
| Registry | GitHub (暂定) | 免费、Git-based、社区友好 |
| CLI | npm | 标准包管理 |

---

*最后更新: 2026-01-06*
