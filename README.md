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

## 3) 部署（GitHub Actions）

在仓库 Secrets 中配置：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

推送到 `main` 会自动跑 CI 并部署。

## 4) 测试

```bash
pnpm test
pnpm e2e
```
