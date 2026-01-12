# 部署指南 | Deployment Guide

本文档介绍如何将 skild.sh 部署到 Cloudflare Pages。

---

## 🚀 快速开始

### 本地开发

```bash
# 启动联合调试（registry worker + console）
pnpm dev

# 仅启动 web（skild.sh）
pnpm dev:web

# 仅启动 console（并自动指向本地 registry）
pnpm dev:console

# 仅启动本地 registry worker（wrangler dev）
pnpm dev:registry

# 构建所有 apps
pnpm build

# 构建指定 app
pnpm build:web

# 预览生产版本
pnpm preview

# 清理构建产物
pnpm clean
```

### 多 App 扩展

后续添加新 app 时（如 `apps/docs`），只需：
1. 在 `apps/` 下创建新目录
2. 在根 `package.json` 添加对应脚本：
   ```json
   "dev:docs": "pnpm --filter docs dev",
   "build:docs": "pnpm --filter docs build"
   ```


---

## ☁️ Cloudflare Pages 部署

### 方式一：通过 GitHub 自动部署（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 进入 **Workers & Pages**

2. **创建新项目**
   - 点击 **Create** → **Pages** → **Connect to Git**
   - 选择 GitHub 仓库 `Peiiii/skild`

3. **配置构建设置**
   | 设置项 | 值 |
   |--------|-----|
   | **Framework preset** | Astro |
   | **Build command** | `pnpm build:web` |
   | **Build output directory** | `apps/web/dist` |
   | **Root directory** | `/` |

4. **保存并部署**
   - 点击 **Save and Deploy**
   - 等待构建完成（约 1-2 分钟）

5. **绑定自定义域名**
   - 在项目设置中，进入 **Custom domains**
   - 添加 `skild.sh`
   - 按照提示配置 DNS

### 方式二：通过 Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy apps/web/dist --project-name=skild
```

---

## 🔧 环境变量（如需要）

在 Cloudflare Pages 项目设置中，可以配置环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PUBLIC_SITE_URL` | 网站 URL | `https://skild.sh` |

---

## 📋 部署检查清单

- [ ] 确保 `pnpm build` 本地构建成功
- [ ] GitHub 仓库已推送最新代码
- [ ] Cloudflare Pages 项目已创建
- [ ] 构建设置正确配置
- [ ] 自定义域名已绑定
- [ ] DNS 已正确配置

---

## 🔄 自动部署

连接 GitHub 后，每次推送到 `main` 分支会自动触发部署：

```bash
git add .
git commit -m "Update landing page"
git push origin main
# Cloudflare 会自动构建并部署
```

---

*最后更新: 2026-01-06*
