import type { Bindings } from '../env'
import { desc, eq, sql, type SQL } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from '../lib/db'
import { html, redirect, badRequest, unauthorized, json } from '../lib/http'
import { criticalCss, layout } from '../lib/templates'
import { autoDescription, escapeHtml } from '../lib/seo'
import { clearAuthCookies, authCookies, issueTokens, refreshTokens, requireAdmin } from '../lib/auth'
import { ulid, nowIso } from '../lib/ids'
import { hashPassword, isPasswordHashSupported, verifyPassword } from '../lib/password'
import { pick, resolveLocale, type SiteLocale } from '../lib/i18n'

type AdminUser = { id: string; email: string; password_hash: string; role: string }

function adminHeader(env: Bindings, req: Request, locale: SiteLocale, actions: string): string {
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/">
        <span class="brand-badge">CMS</span>
        <span class="brand-copy">
          <strong>${escapeHtml(env.SITE_NAME)}</strong>
          <small>内容发布与素材管理后台</small>
        </span>
      </a>
      <div class="nav-links">
        <a class="nav-link" href="/admin">${escapeHtml('概览')}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml('国家')}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml('供应商')}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml('套餐')}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml('文章')}</a>
        <a class="nav-link" href="/admin/settings">${escapeHtml('网站设置')}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml('媒体')}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml('导入/导出')}</a>
      </div>
      <div class="nav-actions">
        ${actions}
      </div>
    </nav>
  </header>`
}

type CountRow = { total: number; published?: number; draft?: number; scheduled?: number; archived?: number }
type PostLocaleCoverageRow = { bilingual: number; zh_only: number; en_only: number }

type StatusTable = typeof schema.countries | typeof schema.operators | typeof schema.products

function countByStatus(table: StatusTable): SQL {
  return sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ${table.status}='published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN ${table.status}='draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN ${table.status}='scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN ${table.status}='archived' THEN 1 ELSE 0 END) as archived
    FROM ${table}
  `
}

function groupedPostKeyExpr(): SQL<string> {
  return sql<string>`coalesce(nullif(${schema.posts.refSlug}, ''), ${schema.posts.slug})`
}

async function loadGroupedPostCounts(db: ReturnType<typeof getDb>): Promise<CountRow | undefined> {
  const articleKey = groupedPostKeyExpr()
  const groupedPosts = db
    .select({
      article_key: articleKey,
      status: sql<string>`
        case
          when sum(case when ${schema.posts.status} = 'published' then 1 else 0 end) > 0 then 'published'
          when sum(case when ${schema.posts.status} = 'scheduled' then 1 else 0 end) > 0 then 'scheduled'
          when sum(case when ${schema.posts.status} = 'draft' then 1 else 0 end) > 0 then 'draft'
          else 'archived'
        end
      `.as('status')
    })
    .from(schema.posts)
    .groupBy(articleKey)
    .as('grouped_posts')
  return db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when ${groupedPosts.status} = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${groupedPosts.status} = 'draft' then 1 else 0 end)`,
      scheduled: sql<number>`sum(case when ${groupedPosts.status} = 'scheduled' then 1 else 0 end)`,
      archived: sql<number>`sum(case when ${groupedPosts.status} = 'archived' then 1 else 0 end)`
    })
    .from(groupedPosts)
    .get()
}

async function loadPostLocaleCoverage(db: ReturnType<typeof getDb>): Promise<PostLocaleCoverageRow | undefined> {
  const articleKey = groupedPostKeyExpr()
  const localeGroups = db
    .select({
      article_key: articleKey,
      has_zh: sql<number>`max(case when lower(${schema.posts.locale}) like 'zh%' then 1 else 0 end)`.as('has_zh'),
      has_en: sql<number>`max(case when lower(${schema.posts.locale}) like 'en%' then 1 else 0 end)`.as('has_en')
    })
    .from(schema.posts)
    .groupBy(articleKey)
    .as('locale_groups')
  return db
    .select({
      bilingual: sql<number>`sum(case when ${localeGroups.has_zh} = 1 and ${localeGroups.has_en} = 1 then 1 else 0 end)`,
      zh_only: sql<number>`sum(case when ${localeGroups.has_zh} = 1 and ${localeGroups.has_en} = 0 then 1 else 0 end)`,
      en_only: sql<number>`sum(case when ${localeGroups.has_zh} = 0 and ${localeGroups.has_en} = 1 then 1 else 0 end)`
    })
    .from(localeGroups)
    .get()
}

async function loadListRows(
  db: ReturnType<typeof getDb>,
  entity: 'categories' | 'countries' | 'operators' | 'products' | 'posts',
  lang?: string
): Promise<Record<string, unknown>[]> {
  if (entity === 'posts') return loadPostListRows(db, lang)
  if (entity === 'categories') {
    return db
      .select({
        id: schema.categories.id,
        slug: schema.categories.slug,
        name: schema.categories.name,
        status: sql<string>`''`,
        updated_at: schema.categories.updatedAt
      })
      .from(schema.categories)
      .orderBy(desc(schema.categories.updatedAt))
      .limit(500) as Promise<Record<string, unknown>[]>
  }
  if (entity === 'countries') {
    return db
      .select({
        id: schema.countries.id,
        slug: schema.countries.slug,
        name: schema.countries.name,
        status: schema.countries.status,
        updated_at: schema.countries.updatedAt
      })
      .from(schema.countries)
      .orderBy(desc(schema.countries.updatedAt))
      .limit(200) as Promise<Record<string, unknown>[]>
  }
  if (entity === 'operators') {
    return db
      .select({
        id: schema.operators.id,
        slug: schema.operators.slug,
        name: schema.operators.name,
        status: schema.operators.status,
        updated_at: schema.operators.updatedAt
      })
      .from(schema.operators)
      .orderBy(desc(schema.operators.updatedAt))
      .limit(200) as Promise<Record<string, unknown>[]>
  }
  return db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      status: schema.products.status,
      updated_at: schema.products.updatedAt
    })
    .from(schema.products)
    .orderBy(desc(schema.products.updatedAt))
    .limit(200) as Promise<Record<string, unknown>[]>
}

async function loadPostListRows(db: ReturnType<typeof getDb>, lang?: string): Promise<Record<string, unknown>[]> {
  const articleKey = groupedPostKeyExpr()
  const pickId = sql<string>`
    coalesce(
      min(case when lower(${schema.posts.locale}) like 'zh%' then ${schema.posts.id} end),
      min(case when lower(${schema.posts.locale}) like 'en%' then ${schema.posts.id} end),
      min(${schema.posts.id})
    )
  `
  const zhTitle = sql<string | null>`max(case when lower(${schema.posts.locale}) like 'zh%' then ${schema.posts.title} end)`
  const enTitle = sql<string | null>`max(case when lower(${schema.posts.locale}) like 'en%' then ${schema.posts.title} end)`
  const hasZh = sql<number>`max(case when lower(${schema.posts.locale}) like 'zh%' then 1 else 0 end)`
  const hasEn = sql<number>`max(case when lower(${schema.posts.locale}) like 'en%' then 1 else 0 end)`
  const categoryName = sql<string>`coalesce(max(${schema.categories.name}), '')`
  const groupedStatus = sql<string>`
    case
      when sum(case when ${schema.posts.status} = 'published' then 1 else 0 end) > 0 then 'published'
      when sum(case when ${schema.posts.status} = 'scheduled' then 1 else 0 end) > 0 then 'scheduled'
      when sum(case when ${schema.posts.status} = 'draft' then 1 else 0 end) > 0 then 'draft'
      else 'archived'
    end
  `
  const updatedAt = sql<string>`max(${schema.posts.updatedAt})`
  const selection = {
    id: pickId,
    slug: articleKey,
    zh_title: zhTitle,
    en_title: enTitle,
    has_zh: hasZh,
    has_en: hasEn,
    category_name: categoryName,
    status: groupedStatus,
    updated_at: updatedAt
  }
  if (lang) {
    return db
      .select(selection)
      .from(schema.posts)
      .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
      .where(sql`lower(${schema.posts.locale}) = ${lang}`)
      .groupBy(articleKey)
      .orderBy(desc(updatedAt))
      .limit(200) as Promise<Record<string, unknown>[]>
  }
  return db
    .select(selection)
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
    .groupBy(articleKey)
    .orderBy(desc(updatedAt))
    .limit(200) as Promise<Record<string, unknown>[]>
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    scheduled: '定时发布',
    published: '已发布',
    archived: '已归档'
  }
  return map[status] ?? status
}

function localeLabel(locale: string | null | undefined): string {
  const value = (locale ?? '').toLowerCase()
  if (value === 'zh' || value === 'zh-cn' || value === 'zh-hans') return '中文'
  if (value === 'en' || value === 'en-us' || value === 'en-gb') return 'English'
  return locale || '未设置'
}

export async function adminLoginPage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const canonical = new URL('/admin/login', env.APP_ORIGIN).toString()
  const body = `
  ${adminHeader(env, req, locale, `<a class="btn" href="/">${escapeHtml(pick(locale, '返回前台', 'Back to site'))}</a>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Admin</span>
      <div>
        <h1>${escapeHtml(pick(locale, '登录管理后台', 'Sign in to admin'))}</h1>
        <p>${escapeHtml(pick(locale, '统一管理国家页、供应商、套餐、文章和媒体资源。', 'Manage country pages, operators, products, posts, and media in one place.'))}</p>
      </div>
    </section>
    <section class="card muted-panel" style="max-width:520px;margin:0 auto">
      <form method="POST" action="/api/admin/auth/login">
        <label><small>${escapeHtml(pick(locale, '邮箱', 'Email'))}</small><input class="input" type="email" name="email" required></label>
        <div style="height:8px"></div>
        <label><small>${escapeHtml(pick(locale, '密码', 'Password'))}</small><input class="input" type="password" name="password" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">${escapeHtml(pick(locale, '登录', 'Sign in'))}</button>
      </form>
    </section>
  </main>
  <footer><small>${escapeHtml(pick(locale, '仅限编辑/管理员使用。', 'Editors and administrators only.'))}</small></footer>
  `
  return html(
    layout(
      {
        title: pick(locale, `登录管理后台 | ${env.SITE_NAME}`, `Admin Login | ${env.SITE_NAME}`),
        description: pick(locale, '仅限编辑/管理员使用。', 'Editors and administrators only.'),
        canonical,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        robots: 'noindex, nofollow'
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminHomePage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const canonical = new URL('/admin', env.APP_ORIGIN).toString()
  const db = getDb(env.DB)
  const [countries, operators, products, posts, categories, postLocaleCoverage] = await Promise.all([
    db.get<CountRow>(countByStatus(schema.countries)),
    db.get<CountRow>(countByStatus(schema.operators)),
    db.get<CountRow>(countByStatus(schema.products)),
    loadGroupedPostCounts(db),
    db
      .select({ total: sql<number>`count(*)` })
      .from(schema.categories)
      .get(),
    loadPostLocaleCoverage(db)
  ])
  const body = `
  ${adminHeader(env, req, locale, `<form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">${escapeHtml(pick(locale, '退出', 'Sign out'))}</button></form>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Dashboard</span>
      <div>
        <h1>${escapeHtml(pick(locale, '站点收录与发布概览', 'Site inventory & publishing overview'))}</h1>
        <p>${escapeHtml(pick(locale, '已登录：', 'Signed in as:'))}<strong>${escapeHtml(user.userId)}</strong>${escapeHtml(pick(locale, '。这里展示当前网站已收录条目、发布状态与文章分组后的语言覆盖情况。', '. This dashboard shows indexed items, publishing states, and grouped post language coverage.'))}</p>
      </div>
    </section>
    <div class="section-gap">
      <section class="card">
        <h2>核心收录数据</h2>
        <div class="card-grid">
          <article class="card muted-panel"><h3>国家</h3><p>总数 <strong>${countries?.total ?? 0}</strong></p><small>已发布 ${countries?.published ?? 0} / 草稿 ${countries?.draft ?? 0}</small></article>
          <article class="card muted-panel"><h3>供应商</h3><p>总数 <strong>${operators?.total ?? 0}</strong></p><small>已发布 ${operators?.published ?? 0} / 草稿 ${operators?.draft ?? 0}</small></article>
          <article class="card muted-panel"><h3>套餐</h3><p>总数 <strong>${products?.total ?? 0}</strong></p><small>已发布 ${products?.published ?? 0} / 草稿 ${products?.draft ?? 0}</small></article>
          <article class="card muted-panel"><h3>文章</h3><p>总数 <strong>${posts?.total ?? 0}</strong></p><small>已发布 ${posts?.published ?? 0} / 草稿 ${posts?.draft ?? 0}</small></article>
          <article class="card muted-panel"><h3>文章分类</h3><p>总数 <strong>${categories?.total ?? 0}</strong></p><small>用于文章归类与前台内容导航</small></article>
        </div>
      </section>
      <section class="split-grid">
        <section class="card">
          <h2>发布状态</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>模块</th><th>已发布</th><th>定时发布</th><th>草稿</th><th>已归档</th></tr></thead>
              <tbody>
                <tr><td>国家</td><td>${countries?.published ?? 0}</td><td>${countries?.scheduled ?? 0}</td><td>${countries?.draft ?? 0}</td><td>${countries?.archived ?? 0}</td></tr>
                <tr><td>供应商</td><td>${operators?.published ?? 0}</td><td>${operators?.scheduled ?? 0}</td><td>${operators?.draft ?? 0}</td><td>${operators?.archived ?? 0}</td></tr>
                <tr><td>套餐</td><td>${products?.published ?? 0}</td><td>${products?.scheduled ?? 0}</td><td>${products?.draft ?? 0}</td><td>${products?.archived ?? 0}</td></tr>
                <tr><td>文章</td><td>${posts?.published ?? 0}</td><td>${posts?.scheduled ?? 0}</td><td>${posts?.draft ?? 0}</td><td>${posts?.archived ?? 0}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="card">
          <h2>文章语言覆盖</h2>
          <div class="chip-row">
            <span class="btn">${escapeHtml(pick(locale, '中英双语', 'Bilingual'))} ${escapeHtml(String(postLocaleCoverage?.bilingual ?? 0))}</span>
            <span class="btn">${escapeHtml(pick(locale, '仅中文', 'Chinese only'))} ${escapeHtml(String(postLocaleCoverage?.zh_only ?? 0))}</span>
            <span class="btn">${escapeHtml(pick(locale, '仅英文', 'English only'))} ${escapeHtml(String(postLocaleCoverage?.en_only ?? 0))}</span>
          </div>
          <div style="height:12px"></div>
          <p>${escapeHtml(pick(locale, '文章模块现已按同一篇文章分组统计，中英双语版本会视为同一篇内容。', 'Posts are now grouped as a single article, and bilingual versions count as one piece of content.'))}</p>
        </section>
      </section>
      <section class="card">
        <h2>${escapeHtml(pick(locale, '快捷入口', 'Quick Actions'))}</h2>
        <div class="admin-actions">
          <a class="btn" href="/admin/countries">管理国家页</a>
          <a class="btn" href="/admin/operators">管理供应商</a>
          <a class="btn" href="/admin/products">管理套餐</a>
          <a class="btn" href="/admin/posts">管理文章</a>
          <a class="btn" href="/admin/settings">网站设置</a>
          <a class="btn" href="/admin/categories">管理文章分类</a>
          <a class="btn" href="/admin/import-export">导入/导出</a>
        </div>
      </section>
    </div>
  </main>
  `
  return html(
    layout(
      {
        title: `内容管理台 | ${env.SITE_NAME}`,
        description: '管理供应商、套餐、国家SEO页与发布。',
        canonical,
        robots: 'noindex, nofollow'
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminListPage(
  env: Bindings,
  req: Request,
  entity: 'categories' | 'countries' | 'operators' | 'products' | 'posts'
): Promise<Response> {
  const locale = resolveLocale(req)
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const canonical = new URL(`/admin/${entity}`, env.APP_ORIGIN).toString()
  const url = new URL(req.url)
  const lang = (url.searchParams.get('lang') ?? '').trim().toLowerCase()
  const rows = await loadListRows(getDb(env.DB), entity, lang)
  const titleMap: Record<string, string> = {
    categories: '文章分类',
    countries: '国家',
    operators: '供应商',
    products: '套餐',
    posts: '文章'
  }
  const body = `
  ${adminHeader(env, req, locale, `<form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">${escapeHtml(pick(locale, '退出', 'Sign out'))}</button></form>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Admin List</span>
      <div>
        <h1>${escapeHtml(titleMap[entity])}${escapeHtml(pick(locale, '列表', ' List'))}</h1>
        <p>${escapeHtml(pick(locale, '集中查看最近更新的内容记录，并进入编辑页继续维护。', 'Review recently updated records and continue editing from here.'))}</p>
      </div>
    </section>
    <div class="section-gap">
      ${entity !== 'posts' ? `<section class="card muted-panel"><div class="admin-actions"><a class="btn primary" href="/admin/${entity}/new">${escapeHtml(pick(locale, '新增', 'Create'))} ${escapeHtml(titleMap[entity])}</a></div></section>` : ''}
      ${entity === 'posts' ? `<section class="card muted-panel"><h2>${escapeHtml(pick(locale, '文章模块', 'Post Module'))}</h2><div class="admin-actions"><a class="btn" href="/admin/posts">${escapeHtml(pick(locale, '全部文章', 'All posts'))}</a><a class="btn ${lang === 'zh' || lang === 'zh-cn' ? 'primary' : ''}" href="/admin/posts?lang=zh">${escapeHtml(pick(locale, '含中文版本', 'Has Chinese'))}</a><a class="btn ${lang === 'en' ? 'primary' : ''}" href="/admin/posts?lang=en">${escapeHtml(pick(locale, '含英文版本', 'Has English'))}</a><a class="btn" href="/admin/categories">${escapeHtml(pick(locale, '管理文章分类', 'Manage categories'))}</a><a class="btn primary" href="/admin/posts/new">${escapeHtml(pick(locale, '新增文章', 'New post'))}</a></div></section>` : ''}
      <section class="card">
        <div class="table-wrap">
        <table>
          <thead>${entity === 'posts' ? '<tr><th>slug</th><th>中文标题</th><th>英文标题</th><th>语言覆盖</th><th>分类</th><th>状态</th><th>更新时间</th><th></th></tr>' : '<tr><th>slug</th><th>name</th><th>status</th><th>updated</th><th></th></tr>'}</thead>
          <tbody>
            ${rows
              .map((r) => {
                const slug = String(r.slug ?? '')
                const name = String((r as any).name ?? (r as any).title ?? '')
                const status = String(r.status ?? '')
                const updated = String(r.updated_at ?? '')
                if (entity === 'posts') {
                  const zhTitle = String((r as any).zh_title ?? '')
                  const enTitle = String((r as any).en_title ?? '')
                  const hasZh = Number((r as any).has_zh ?? 0) === 1
                  const hasEn = Number((r as any).has_en ?? 0) === 1
                  const category = String((r as any).category_name ?? '')
                  const coverage = [hasZh ? '中文' : '', hasEn ? 'English' : ''].filter(Boolean).join(' / ') || '未设置'
                  return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(zhTitle || '—')}</td><td>${escapeHtml(enTitle || '—')}</td><td>${escapeHtml(coverage)}</td><td>${escapeHtml(category || '未分类')}</td><td>${escapeHtml(statusLabel(status))}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">编辑</a></td></tr>`
                }
                return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(status ? statusLabel(status) : '—')}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">编辑</a></td></tr>`
              })
              .join('')}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  </main>
  `
  return html(
    layout(
      {
        title: pick(locale, `${titleMap[entity]}管理 | ${env.SITE_NAME}`, `${titleMap[entity]} | ${env.SITE_NAME}`),
        description: autoDescription('内容管理列表'),
        canonical,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        robots: 'noindex, nofollow'
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function apiAdminLogin(env: Bindings, req: Request): Promise<Response> {
  const isLocal = new URL(req.url).hostname === 'localhost'
  const secure = !isLocal
  const form = await req.formData()
  const email = String(form.get('email') ?? '').toLowerCase().trim()
  const password = String(form.get('password') ?? '')
  if (!email || !password) return badRequest('Missing credentials')
  const db = getDb(env.DB)
  const user = await db
    .select({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      password_hash: schema.adminUsers.passwordHash,
      role: schema.adminUsers.role
    })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
    .limit(1)
    .get() as AdminUser | undefined
  if (!user) return unauthorized('Invalid credentials')
  let ok = false
  if (isPasswordHashSupported(user.password_hash)) {
    ok = await verifyPassword(password, user.password_hash)
  } else if (
    env.BOOTSTRAP_ADMIN === 'true' &&
    env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim() === email &&
    env.BOOTSTRAP_ADMIN_PASSWORD === password
  ) {
    const passwordHash = await hashPassword(password, crypto.randomUUID())
    await db
      .update(schema.adminUsers)
      .set({
        passwordHash,
        updatedAt: nowIso()
      })
      .where(eq(schema.adminUsers.id, user.id))
    ok = true
  }
  if (!ok) return unauthorized('Invalid credentials')
  const tokens = await issueTokens(env, user.id, user.role)
  const cookies = authCookies({ access: tokens.access, refresh: tokens.refresh }, secure)
  const headers = new Headers({ Location: '/admin' })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 303, headers })
}

export async function apiAdminLogout(env: Bindings, req: Request): Promise<Response> {
  const isLocal = new URL(req.url).hostname === 'localhost'
  const secure = !isLocal
  const headers = new Headers({ Location: '/admin/login' })
  for (const c of clearAuthCookies(secure)) headers.append('Set-Cookie', c)
  return new Response(null, { status: 303, headers })
}

export async function apiAdminRefresh(env: Bindings, req: Request): Promise<Response> {
  const isLocal = new URL(req.url).hostname === 'localhost'
  const secure = !isLocal
  const next = await refreshTokens(env, req)
  if (!next) return unauthorized('Refresh failed')
  const headers = new Headers()
  for (const c of authCookies(next, secure)) headers.append('Set-Cookie', c)
  return json({ ok: true }, { headers })
}

export async function apiAdminUpsertSimple(env: Bindings, req: Request, entity: 'countries' | 'operators' | 'products' | 'posts'): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const data = await req.json<Record<string, unknown>>().catch(() => null)
  if (!data) return badRequest('Invalid JSON')
  const id = typeof data.id === 'string' && data.id ? data.id : ulid()
  const now = nowIso()
  const status = typeof data.status === 'string' ? data.status : 'draft'
  const db = getDb(env.DB)
  if (entity === 'countries') {
    const iso2 = String(data.iso2 ?? '').toLowerCase()
    const name = String(data.name ?? '')
    const slug = String(data.slug ?? '')
    if (!iso2 || !name || !slug) return badRequest('Missing fields')
    const publishAt = typeof data.publish_at === 'string' ? data.publish_at : null
    const publishedAt = typeof data.published_at === 'string' ? data.published_at : null
    await db
      .insert(schema.countries)
      .values({
        id,
        iso2,
        name,
        slug,
        seoTitle: String(data.seo_title ?? ''),
        seoDescription: String(data.seo_description ?? ''),
        contentHtml: String(data.content_html ?? ''),
        faqJson: typeof data.faq_json === 'string' ? data.faq_json : JSON.stringify(data.faq_json ?? null),
        status,
        publishAt,
        publishedAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.countries.id,
        set: {
          iso2,
          name,
          slug,
          seoTitle: String(data.seo_title ?? ''),
          seoDescription: String(data.seo_description ?? ''),
          contentHtml: String(data.content_html ?? ''),
          faqJson: typeof data.faq_json === 'string' ? data.faq_json : JSON.stringify(data.faq_json ?? null),
          status,
          publishAt,
          publishedAt: publishedAt ?? sql`${schema.countries.publishedAt}`,
          updatedAt: now
        }
      })
  }
  return json({ ok: true, id })
}

