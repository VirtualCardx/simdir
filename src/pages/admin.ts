import type { Bindings } from '../env'
import { dbAll, dbExec, dbGet } from '../lib/db'
import { html, redirect, badRequest, unauthorized, json } from '../lib/http'
import { criticalCss, layout } from '../lib/templates'
import { autoDescription, escapeHtml } from '../lib/seo'
import { clearAuthCookies, authCookies, issueTokens, refreshTokens, requireAdmin } from '../lib/auth'
import { ulid, nowIso } from '../lib/ids'
import { verifyPassword } from '../lib/password'
import { languageSwitchHref, pick, resolveLocale, type SiteLocale } from '../lib/i18n'

type AdminUser = { id: string; email: string; password_hash: string; role: string }

function adminHeader(env: Bindings, req: Request, locale: SiteLocale, actions: string): string {
  const current = new URL(req.url)
  const currentPath = `${current.pathname}${current.search}`
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
        <a class="nav-link" href="/admin">${escapeHtml(pick(locale, '概览', 'Overview'))}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml(pick(locale, '国家', 'Countries'))}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml(pick(locale, '供应商', 'Operators'))}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml(pick(locale, '套餐', 'Products'))}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml(pick(locale, '文章', 'Posts'))}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml(pick(locale, '媒体', 'Media'))}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml(pick(locale, '导入/导出', 'Import / Export'))}</a>
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === 'zh' ? 'primary' : ''}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref('zh', currentPath))}">中文</a>
        <a class="btn ${locale === 'en' ? 'primary' : ''}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref('en', currentPath))}">EN</a>
        ${actions}
      </div>
    </nav>
  </header>`
}

type CountRow = { total: number; published?: number; draft?: number; scheduled?: number; archived?: number }

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
  const [countries, operators, products, posts, categories, postLocales] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM countries").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM operators").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM products").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM posts").first<CountRow>(),
    env.DB.prepare('SELECT COUNT(*) as total FROM categories').first<{ total: number }>(),
    env.DB.prepare("SELECT locale, COUNT(*) as total FROM posts GROUP BY locale ORDER BY total DESC").all<{ locale: string; total: number }>()
  ])
  const body = `
  ${adminHeader(env, req, locale, `<form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">${escapeHtml(pick(locale, '退出', 'Sign out'))}</button></form>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Dashboard</span>
      <div>
        <h1>${escapeHtml(pick(locale, '站点收录与发布概览', 'Site inventory & publishing overview'))}</h1>
        <p>${escapeHtml(pick(locale, '已登录：', 'Signed in as:'))}<strong>${escapeHtml(user.userId)}</strong>${escapeHtml(pick(locale, '。这里展示当前网站已收录条目、发布状态与文章语言分布。', '. This dashboard shows indexed items, publishing states, and post language distribution.'))}</p>
      </div>
    </section>
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
        <h2>文章语言分布</h2>
        <div class="chip-row">
          ${(postLocales.results ?? [])
            .map((row) => `<span class="btn">${escapeHtml(localeLabel(row.locale))} ${escapeHtml(String(row.total))}</span>`)
            .join('') || '<small>暂无文章数据</small>'}
        </div>
        <div style="height:12px"></div>
        <p>${escapeHtml(pick(locale, '建议文章至少覆盖中文与 English 两个版本，并在后台通过语言代码进行筛选和维护。', 'Keep both Chinese and English versions whenever possible, and use language filters in admin to maintain them.'))}</p>
      </section>
    </section>
    <section class="card">
      <h2>${escapeHtml(pick(locale, '快捷入口', 'Quick Actions'))}</h2>
      <div class="admin-actions">
        <a class="btn" href="/admin/countries">管理国家页</a>
        <a class="btn" href="/admin/operators">管理供应商</a>
        <a class="btn" href="/admin/products">管理套餐</a>
        <a class="btn" href="/admin/posts">管理文章</a>
        <a class="btn" href="/admin/categories">管理文章分类</a>
        <a class="btn" href="/admin/import-export">导入/导出</a>
      </div>
    </section>
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
  const rows = await dbAll<Record<string, unknown>>(env.DB, listSql(entity, lang), lang && entity === 'posts' ? [lang] : [])
  const titleMap: Record<string, string> = {
    categories: '文章分类',
    countries: '国家',
    operators: '供应商',
    products: '套餐',
    posts: '文章'
  }
  const body = `
  ${adminHeader(env, req, locale, `<a class="btn primary" href="/admin/${entity}/new">${escapeHtml(pick(locale, '新增', 'Create'))}</a>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Admin List</span>
      <div>
        <h1>${escapeHtml(titleMap[entity])}${escapeHtml(pick(locale, '列表', ' List'))}</h1>
        <p>${escapeHtml(pick(locale, '集中查看最近更新的内容记录，并进入编辑页继续维护。', 'Review recently updated records and continue editing from here.'))}</p>
      </div>
    </section>
    ${entity === 'posts' ? `<section class="card muted-panel"><h2>${escapeHtml(pick(locale, '文章模块', 'Post Module'))}</h2><div class="admin-actions"><a class="btn" href="/admin/posts">${escapeHtml(pick(locale, '全部文章', 'All posts'))}</a><a class="btn ${lang === 'zh' || lang === 'zh-cn' ? 'primary' : ''}" href="/admin/posts?lang=zh">${escapeHtml(pick(locale, '中文文章', 'Chinese posts'))}</a><a class="btn ${lang === 'en' ? 'primary' : ''}" href="/admin/posts?lang=en">English Posts</a><a class="btn" href="/admin/categories">${escapeHtml(pick(locale, '管理文章分类', 'Manage categories'))}</a><a class="btn primary" href="/admin/posts/new">${escapeHtml(pick(locale, '新增文章', 'New post'))}</a></div></section>` : ''}
    <section class="card">
      <div class="table-wrap">
      <table>
        <thead>${entity === 'posts' ? '<tr><th>slug</th><th>标题</th><th>语言</th><th>分类</th><th>状态</th><th>更新时间</th><th></th></tr>' : '<tr><th>slug</th><th>name</th><th>status</th><th>updated</th><th></th></tr>'}</thead>
        <tbody>
          ${rows
            .map((r) => {
              const slug = String(r.slug ?? '')
              const name = String((r as any).name ?? (r as any).title ?? '')
              const status = String(r.status ?? '')
              const updated = String(r.updated_at ?? '')
              if (entity === 'posts') {
                const locale = String((r as any).locale ?? '')
                const category = String((r as any).category_name ?? '')
                return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(localeLabel(locale))}</td><td>${escapeHtml(category || '未分类')}</td><td>${escapeHtml(statusLabel(status))}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">编辑</a></td></tr>`
              }
              return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(status ? statusLabel(status) : '—')}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">编辑</a></td></tr>`
            })
            .join('')}
        </tbody>
      </table>
      </div>
    </section>
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

function listSql(entity: 'categories' | 'countries' | 'operators' | 'products' | 'posts', lang?: string): string {
  if (entity === 'posts') {
    const where = lang ? 'WHERE lower(p.locale)=?' : ''
    return `SELECT p.id, p.slug, p.title as name, p.locale, p.status, p.updated_at, c.name as category_name FROM posts p LEFT JOIN categories c ON c.id=p.category_id ${where} ORDER BY p.updated_at DESC LIMIT 200`
  }
  if (entity === 'categories') return `SELECT id, slug, name, '' as status, updated_at FROM categories ORDER BY updated_at DESC LIMIT 500`
  return `SELECT id, slug, name, status, updated_at FROM ${entity} ORDER BY updated_at DESC LIMIT 200`
}

export async function apiAdminLogin(env: Bindings, req: Request): Promise<Response> {
  const isLocal = new URL(req.url).hostname === 'localhost'
  const secure = !isLocal
  const form = await req.formData()
  const email = String(form.get('email') ?? '').toLowerCase().trim()
  const password = String(form.get('password') ?? '')
  if (!email || !password) return badRequest('Missing credentials')
  const user = await env.DB.prepare('SELECT id,email,password_hash,role FROM admin_users WHERE email=?').bind(email).first<AdminUser>()
  if (!user) return unauthorized('Invalid credentials')
  const ok = await verifyPassword(password, user.password_hash)
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
  if (entity === 'countries') {
    const iso2 = String(data.iso2 ?? '').toLowerCase()
    const name = String(data.name ?? '')
    const slug = String(data.slug ?? '')
    if (!iso2 || !name || !slug) return badRequest('Missing fields')
    await dbExec(
      env.DB,
      'INSERT INTO countries (id,iso2,name,slug,seo_title,seo_description,content_html,faq_json,status,publish_at,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET iso2=excluded.iso2,name=excluded.name,slug=excluded.slug,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,updated_at=excluded.updated_at',
      [
        id,
        iso2,
        name,
        slug,
        String(data.seo_title ?? ''),
        String(data.seo_description ?? ''),
        String(data.content_html ?? ''),
        typeof data.faq_json === 'string' ? data.faq_json : JSON.stringify(data.faq_json ?? null),
        status,
        typeof data.publish_at === 'string' ? data.publish_at : null,
        typeof data.published_at === 'string' ? data.published_at : null,
        now,
        now
      ]
    )
  }
  return json({ ok: true, id })
}

