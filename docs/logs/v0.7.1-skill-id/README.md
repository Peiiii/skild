## 迭代：v0.7.1-skill-id

### 改了什么
- 为 skills 增加稳定的 `id` 字段并完成历史回填。
- skills 列表、publisher skills、skill detail API 增加 `id` 输出。
- `/discover` 与 `/linked-items` cursor 升级为 `v2|...|id`，旧 cursor 兼容解析。
- `/skills` 列表标记为 deprecated，避免与 `/discover` 混用。
- Console API 类型同步。

### 验证/验收
- `pnpm release:check`
- 冒烟：
  - `node - <<'NODE'` 拉取并校验线上响应：
    ```js
    const https = require('https');
    const fetchJson = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
        });
      }).on('error', reject);
    });
    (async () => {
      const skills = await fetchJson('https://registry.skild.sh/skills?limit=1');
      console.log('skills_deprecated', skills.deprecated);
      console.log('skills_has_id', Boolean(skills.skills?.[0]?.id));
      const discover = await fetchJson('https://registry.skild.sh/discover?limit=1');
      console.log('discover_cursor_v2', String(discover.nextCursor || '').startsWith('v2|'));
      const linked = await fetchJson('https://registry.skild.sh/linked-items?limit=1');
      console.log('linked_cursor_v2', String(linked.nextCursor || '').startsWith('v2|'));
    })();
    ```
    - `skills_deprecated true`
    - `skills_has_id true`
    - `discover_cursor_v2 true`
    - `linked_cursor_v2 true`

### 发布/部署
- migrations apply（remote）：`pnpm deploy:registry`（已执行 `0012_skill_id.sql`）
- deploy：`pnpm deploy:registry`、`pnpm deploy:console`
- 线上冒烟：
  - `https://registry.skild.sh/skills?limit=1` → `deprecated=true` 且 `id` 存在
  - `https://registry.skild.sh/discover?limit=1` → `nextCursor` 为 `v2|...`
  - `https://registry.skild.sh/linked-items?limit=1` → `nextCursor` 为 `v2|...`
- 发布范围：`registry`、`console`
