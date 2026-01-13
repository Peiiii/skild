# Linked Skills（Catalog）

**Linked Skills** 是指向 GitHub 托管的 Skills 的收录条目。它们出现在 Catalog 中供发现，但直接从 GitHub 安装。

---

## 什么是 Linked Skills？

| 方面 | 说明 |
|------|------|
| **用途** | 发现 GitHub Skills，无需正式发布到 registry |
| **安装方式** | 直接从 GitHub URL |
| **发布者** | 原作者（非 skild） |
| **收录者** | 将其添加到 catalog 的社区贡献者 |

适用场景：
- 官方仓库的 Skills（如 `anthropics/skills`）
- 尚未正式发布的社区 Skills
- 作者创建 registry 账号前的早期发现

---

## 浏览 Catalog

1. 访问 [console.skild.sh/linked](https://console.skild.sh/linked)
2. 浏览或搜索 Skills
3. 点击查看详情
4. 复制安装命令

---

## 安装 Linked Skills

Linked Skills 使用 GitHub URL 安装：

```bash
# 示例：安装 anthropics/skills 的 PDF skill
skild install anthropics/skills/skills/pdf

# 或使用完整 URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf
```

---

## 贡献收录

帮助扩充 catalog，提交高质量的 GitHub Skills！

### 要求

1. 在 [console.skild.sh](https://console.skild.sh) **创建账号**
2. **找到 GitHub Skill**，需包含有效的 `SKILL.md`
3. **通过 Console 提交**：
   - 进入 **Catalog** → 点击 **+ Submit**
   - 粘贴 GitHub URL
   - 点击 **Parse** 解析 repo/path/ref
   - 可选填写标题、描述、标签
   - 点击 **Submit**

### URL 格式

支持的 GitHub URL 格式：

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/main
https://github.com/owner/repo/tree/main/path/to/skill
https://github.com/owner/repo/tree/v1.0.0/path/to/skill
```

---

## Linked vs 已发布 Skills

| 特性 | Linked Skills | 已发布 Skills |
|------|---------------|---------------|
| 来源 | GitHub URL | Registry tarball |
| 安装命令 | `skild install owner/repo/path` | `skild install @publisher/skill` |
| 版本管理 | GitHub refs（tags/branches） | Registry 中的 Semver |
| 作者验证 | 无 | 有 Publisher 账号 |
