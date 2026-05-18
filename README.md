# Global eSIM Directory (Cloudflare Workers)

本项目基于 Cloudflare Workers + D1 + R2 + KV + Cache，提供：
- 前台 SSR（/、/search、/country/:slug、/operator/:slug、/product/:slug、/posts、/post/:slug）
- SEO 产物（/sitemap.xml、/robots.txt、Open Graph、JSON-LD）
- 后台最小可用管理台（/admin/login、/admin/*）与 JWT+刷新令牌鉴权
- 批量导入/导出（/admin/import-export、/api/admin/import、/api/admin/export）

## 1) 本地开发

### 安装依赖
```bash
pnpm install
```

### 创建并迁移本地 D1
```bash
pnpm d1:migrate:local
```
该命令在本地会提示确认；在 CI/CD 等非交互环境会自动跳过确认步骤。 

### 配置本地 JWT_SECRET
复制 `.dev.vars.example` 为 `.dev.vars`，并修改 `JWT_SECRET`。

### 配置 Agent Bearer Token
如果需要让 `openclaw`、`hermes agent` 等自动化工具直接调用管理端 API，请额外配置：

```bash
ADMIN_API_BEARER_TOKEN=替换为足够长且随机的强密钥
```

建议使用至少 32 字节以上的随机值，不要提交到仓库，也不要直接写在 `wrangler.toml` 里。

### 启动
```bash
pnpm dev
```

当前项目使用 `wrangler 3.x` 的本地持久化参数 `--persist-to .wrangler/state`。

默认会自动引导创建一个管理员账号：
- 仅当 `wrangler.toml` 中 `BOOTSTRAP_ADMIN="true"` 时启用
- 默认 email: `admin@example.com`
- 默认 password: `ChangeMe-Now!`

## 2) 配置 Cloudflare 资源

### D1
1. 创建 D1 数据库（命名与 `wrangler.toml` 一致：`esim_directory`）
2. 将得到的 `database_id` 写入 `wrangler.toml`
3. 运行远端迁移：
```bash
pnpm d1:migrate:remote
```

### KV
创建 KV namespace，并将 `id` 写入 `wrangler.toml`

### R2
创建 R2 bucket（默认 `esim-directory-media`），并在 `wrangler.toml` 配置。

### JWT_SECRET
使用 `wrangler secret put JWT_SECRET` 配置生产环境密钥。

### ADMIN_API_BEARER_TOKEN
使用 `wrangler secret put ADMIN_API_BEARER_TOKEN` 配置生产环境 agent 调用密钥。

## 3) Agent 管理端 API

新增了一组专门给自动化 agent 调用的管理端接口，统一使用 `Authorization: Bearer <token>` 保护。

### 鉴权方式

```http
Authorization: Bearer YOUR_ADMIN_API_BEARER_TOKEN
```

### 基础接口

- `GET /api/admin/agent/health`
- `GET /api/admin/agent/dashboard`
- `GET /api/admin/agent/settings`
- `PUT /api/admin/agent/settings`
- `POST /api/admin/agent/media/upload`

### 实体接口

以下资源都支持同样的模式：

- `GET /api/admin/agent/categories`
- `POST /api/admin/agent/categories`
- `GET /api/admin/agent/categories/:id`
- `PUT /api/admin/agent/categories/:id`
- `DELETE /api/admin/agent/categories/:id`
- `GET /api/admin/agent/countries`
- `POST /api/admin/agent/countries`
- `GET /api/admin/agent/countries/:id`
- `PUT /api/admin/agent/countries/:id`
- `DELETE /api/admin/agent/countries/:id`
- `GET /api/admin/agent/operators`
- `POST /api/admin/agent/operators`
- `GET /api/admin/agent/operators/:id`
- `PUT /api/admin/agent/operators/:id`
- `DELETE /api/admin/agent/operators/:id`
- `GET /api/admin/agent/products`
- `POST /api/admin/agent/products`
- `GET /api/admin/agent/products/:id`
- `PUT /api/admin/agent/products/:id`
- `DELETE /api/admin/agent/products/:id`
- `GET /api/admin/agent/posts`
- `POST /api/admin/agent/posts`
- `GET /api/admin/agent/posts/:id`
- `PUT /api/admin/agent/posts/:id`
- `DELETE /api/admin/agent/posts/:id`

### 常用查询参数

- `limit`
- `offset`
- `status`
- `slug`
- `locale`，仅 `posts` 列表支持

### 调用示例

检查健康状态：

```bash
curl -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  http://127.0.0.1:8787/api/admin/agent/health
```

读取后台概览：

```bash
curl -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  http://127.0.0.1:8787/api/admin/agent/dashboard
```

创建国家：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/agent/countries \
  -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "iso2": "jp",
    "slug": "japan",
    "name_zh": "日本",
    "name_en": "Japan",
    "seo_title_zh": "日本 eSIM 推荐",
    "seo_title_en": "Japan eSIM Guide",
    "content_html_zh": "<p>日本上网指南</p>",
    "content_html_en": "<p>Japan connectivity guide</p>",
    "faq_json": [],
    "status": "draft"
  }'
```

更新供应商：

```bash
curl -X PUT http://127.0.0.1:8787/api/admin/agent/operators/REPLACE_ID \
  -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "airalo",
    "name_zh": "Airalo",
    "name_en": "Airalo",
    "website_url": "https://www.airalo.com/",
    "status": "published"
  }'
```

创建文章（中英双语）：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/agent/posts \
  -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "japan-esim-guide",
    "title_zh": "日本 eSIM 完全指南",
    "title_en": "Complete Japan eSIM Guide",
    "content_html_zh": "<p>日本 eSIM 使用教程</p>",
    "content_html_en": "<p>How to use eSIM in Japan</p>",
    "excerpt_zh": "一篇文章搞懂日本 eSIM",
    "excerpt_en": "Everything you need to know about Japan eSIM",
    "post_type": "guide",
    "status": "draft"
  }'
```

上传媒体：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/agent/media/upload \
  -H "Authorization: Bearer $ADMIN_API_BEARER_TOKEN" \
  -F "file=@./cover.png"
```

## 4) 部署（GitHub Actions）

在仓库 Secrets 中配置：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

推送到 `main` 会自动跑 CI 并部署。

## 5) 测试

```bash
pnpm test
pnpm e2e
```
