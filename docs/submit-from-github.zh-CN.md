# 从 GitHub 提交 Skills

发现了 GitHub 上优秀的 Skill？提交到 Skild，让更多人发现和使用。

---

## 这是什么？

你可以将任何包含有效 `SKILL.md` 文件的 GitHub 仓库提交到 Skild 目录。提交后，它将可以通过 Skild Console 被发现，并提供简单的安装命令。

---

## 如何提交

### 1. 创建账号

访问 [console.skild.sh](https://console.skild.sh) 并注册。

### 2. 进入提交页面

点击导航栏中的 **Submit Skills from GitHub**。

### 3. 粘贴 GitHub URL

输入 Skill 的 URL。支持的格式：

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/main
https://github.com/owner/repo/tree/main/path/to/skill
https://github.com/owner/repo/tree/v1.0.0/path/to/skill
```

### 4. 解析并提交

点击 **Parse** 提取仓库信息，然后点击 **Submit**。

---

## URL 提示

- URL 应指向包含 `SKILL.md` 的文件夹
- 可以使用特定的分支或标签（如 `tree/v1.0.0`）
- 对于 monorepo，需要包含到 Skill 文件夹的路径

---

## 提交后

提交成功后，该 Skill 将：

- **可被发现** — 出现在 Skild Console 的搜索结果中
- **可被安装** — 用户可以直接从 GitHub 安装：

```bash
skild install owner/repo/path/to/skill
```

---

## 给 Skill 作者

如果你是该 Skill 的作者，想要更多控制权，可以考虑[发布到 registry](./publishing.zh-CN.md)。发布后的 Skills 可获得：

- 语义化版本控制
- 下载统计
- 官方发布者认证
