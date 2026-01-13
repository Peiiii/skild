# Console 使用指南

**Skild Console** ([console.skild.sh](https://console.skild.sh)) 是发现、浏览和发布 Agent Skills 的 Web 界面。

---

## 功能

### 🔍 发现 Skills

浏览 registry 寻找适合你的 Agent 的 Skills：

1. 访问 [console.skild.sh](https://console.skild.sh)
2. 点击导航栏中的 **Discover**
3. 按名称、描述或标签搜索
4. 点击 Skill 查看详情
5. 复制安装命令

### 📦 Catalog（链接 Skills）

**Catalog** 包含从 GitHub 收录的精选 Skills。详见 [Linked Skills 指南](./linked-skills.zh-CN.md)。

### 📤 发布 Skills

将你的 Skills 发布到 registry：

1. **创建账号** — 点击 "Sign up"
2. **验证邮箱** — 查收验证邮件
3. **发布** — 使用 CLI 或 Console

```bash
# CLI 发布
skild login
skild publish --dir ./my-skill
```

---

## 导航

| 菜单 | 说明 |
|------|------|
| **Discover** | 浏览和搜索已发布的 Skills |
| **Catalog** | 浏览收录的 GitHub Skills |
| **Publish** | 发布你的 Skills |
| **@handle ▼** | （登录后）Dashboard、My Skills、Tokens、Settings |

---

## 账号管理

登录后，点击右上角的用户名访问：

- **Dashboard** — 账号概览
- **My Skills** — 管理已发布的 Skills
- **Tokens** — 创建 CLI 认证 Token
- **Settings** — 更新账号信息
