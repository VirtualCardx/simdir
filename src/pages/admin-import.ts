import type { Bindings } from '../env'
import { requireAdmin } from '../lib/auth'
import { dbAll } from '../lib/db'
import { html, redirect, unauthorized, badRequest } from '../lib/http'
import { criticalCss, layout } from '../lib/templates'
import { escapeHtml } from '../lib/seo'
import { nowIso, ulid } from '../lib/ids'
import { languageSwitchHref, pick, resolveLocale, type SiteLocale } from '../lib/i18n'

type Entity = 'categories' | 'countries' | 'operators' | 'products' | 'posts'
type Format = 'json' | 'csv'

function adminNav(env: Bindings, req: Request, locale: SiteLocale): string {
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
        <form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">退出</button></form>
      </div>
    </nav>
  </header>`
}

export async function adminImportExportPage(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const canonical = new URL('/admin/import-export', env.APP_ORIGIN).toString()
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <section class="page-header">
      <span class="eyebrow">Import / Export</span>
      <div>
        <h1>批量导入 / 导出</h1>
        <p>批量维护结构化内容数据，适合初始化导入、备份导出和跨环境迁移。</p>
      </div>
    </section>
    <section class="card">
      <h2>导出</h2>
      <div class="admin-actions">
        ${['categories', 'countries', 'operators', 'products', 'posts']
          .map((e) => {
            const entity = String(e)
            return `<a class="btn" href="/api/admin/export?entity=${encodeURIComponent(entity)}&format=json">导出 ${escapeHtml(entity)}.json</a>
              <a class="btn" href="/api/admin/export?entity=${encodeURIComponent(entity)}&format=csv">导出 ${escapeHtml(entity)}.csv</a>`
          })
          .join('')}
      </div>
    </section>
    <div style="height:12px"></div>
    <section class="card muted-panel">
      <h2>导入</h2>
      <form method="POST" action="/api/admin/import" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>entity</small>
            <select class="input" name="entity">
              <option value="categories">categories</option>
              <option value="countries">countries</option>
              <option value="operators">operators</option>
              <option value="products">products</option>
              <option value="posts">posts</option>
            </select>
          </label>
          <label><small>format</small>
            <select class="input" name="format">
              <option value="json">json</option>
              <option value="csv">csv</option>
            </select>
          </label>
        </div>
        <div style="height:12px"></div>
        <label><small>file</small><input class="input" type="file" name="file" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">开始导入</button>
      </form>
      <div style="height:8px"></div>
      <small>导入会按 id（或 slug）做 upsert；更新时间统一写为当前时间。</small>
    </section>
  </main>
  `
  return html(
    layout({ title: `导入/导出 | ${env.SITE_NAME}`, description: '批量导入导出', canonical, robots: 'noindex, nofollow' }, body, criticalCss()),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function apiAdminExport(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const url = new URL(req.url)
  const entity = String(url.searchParams.get('entity') ?? '') as Entity
  const format = String(url.searchParams.get('format') ?? 'json') as Format
  if (!isEntity(entity)) return badRequest('Invalid entity')
  if (format !== 'json' && format !== 'csv') return badRequest('Invalid format')

  const rows = await dbAll<Record<string, unknown>>(env.DB, `SELECT * FROM ${entity} ORDER BY updated_at DESC LIMIT 20000`)
  if (format === 'json') {
    const body = JSON.stringify(rows, null, 2)
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${entity}.json"`,
        'Cache-Control': 'no-store'
      }
    })
  }

  const columns = csvColumns(entity)
  const body = csvEncode(rows, columns)
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${entity}.csv"`,
      'Cache-Control': 'no-store'
    }
  })
}

export async function apiAdminImport(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const now = nowIso()
  const ct = req.headers.get('content-type') ?? ''
  let entity: Entity
  let format: Format
  let items: Record<string, unknown>[]

  if (ct.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as any
    if (!body) return badRequest('Invalid JSON')
    entity = String(body.entity ?? '') as Entity
    format = String(body.format ?? 'json') as Format
    if (!isEntity(entity)) return badRequest('Invalid entity')
    if (format !== 'json') return badRequest('JSON body supports json format only')
    try {
      items = Array.isArray(body.rows) ? (body.rows as any[]) : Array.isArray(body.items) ? (body.items as any[]) : Array.isArray(body.data) ? (body.data as any[]) : []
      if (!Array.isArray(items)) items = []
      items = items.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
    } catch {
      return badRequest('Invalid rows')
    }
  } else {
    const form = await req.formData().catch(() => null)
    if (!form) return badRequest('Invalid form')
    entity = String(form.get('entity') ?? '') as Entity
    format = String(form.get('format') ?? 'json') as Format
    const file = form.get('file')
    if (!isEntity(entity)) return badRequest('Invalid entity')
    if (format !== 'json' && format !== 'csv') return badRequest('Invalid format')
    if (!(file instanceof File)) return badRequest('Missing file')
    if (file.size <= 0) return badRequest('Empty file')
    if (file.size > 20 * 1024 * 1024) return badRequest('File too large')
    const text = await file.text()
    try {
      items = format === 'json' ? parseJsonArray(text) : csvToObjects(text)
    } catch (e) {
      return badRequest((e as Error).message)
    }
  }

  if (items.length === 0) return badRequest('No rows')

  const stmt = upsertStmt(entity)
  let ok = 0
  for (const item of items) {
    const v = normalize(entity, item, now)
    if (!v) continue
    await env.DB.prepare(stmt.sql).bind(...stmt.bind(v)).run()
    ok += 1
  }
  await env.DB.prepare('INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, detail_json, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(ulid(), user.userId, 'import', entity, null, JSON.stringify({ ok, total: items.length, format }), now)
    .run()
  return redirect('/admin/import-export')
}

function isEntity(e: string): e is Entity {
  return e === 'categories' || e === 'countries' || e === 'operators' || e === 'products' || e === 'posts'
}

function parseJsonArray(text: string): Record<string, unknown>[] {
  const v = JSON.parse(text)
  if (!Array.isArray(v)) throw new Error('JSON must be an array')
  return v.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
}

function csvColumns(entity: Entity): string[] {
  if (entity === 'categories') return ['id', 'parent_id', 'name', 'slug', 'sort_order', 'created_at', 'updated_at']
  if (entity === 'countries')
    return [
      'id',
      'iso2',
      'name',
      'slug',
      'hero_image_key',
      'seo_title',
      'seo_description',
      'content_html',
      'faq_json',
      'status',
      'publish_at',
      'published_at',
      'created_at',
      'updated_at'
    ]
  if (entity === 'operators')
    return [
      'id',
      'name',
      'slug',
      'website_url',
      'logo_image_key',
      'support_channels_json',
      'seo_title',
      'seo_description',
      'content_html',
      'faq_json',
      'status',
      'publish_at',
      'published_at',
      'created_at',
      'updated_at'
    ]
  if (entity === 'products')
    return [
      'id',
      'operator_id',
      'category_id',
      'country_iso2',
      'name',
      'slug',
      'data_gb',
      'days',
      'is_unlimited',
      'supports_hotspot',
      'network_type',
      'price_amount',
      'price_currency',
      'purchase_url',
      'coverage_regions_json',
      'activation_guide_html',
      'status',
      'publish_at',
      'published_at',
      'created_at',
      'updated_at'
    ]
  return [
    'id',
    'category_id',
    'post_type',
    'ref_slug',
    'title',
    'slug',
    'excerpt',
    'content_html',
    'cover_image_key',
    'locale',
    'status',
    'publish_at',
    'published_at',
    'created_at',
    'updated_at'
  ]
}

function csvEncode(rows: Record<string, unknown>[], columns: string[]): string {
  const lines: string[] = []
  lines.push(columns.join(','))
  for (const r of rows) {
    lines.push(
      columns
        .map((c) => {
          const v = r[c]
          const s = v == null ? '' : String(v)
          return csvCell(s)
        })
        .join(',')
    )
  }
  return lines.join('\n') + '\n'
}

function csvCell(s: string): string {
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function csvToObjects(text: string): Record<string, unknown>[] {
  const rows = csvParse(text)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  const out: Record<string, unknown>[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((x) => !x)) continue
    const obj: Record<string, unknown> = {}
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = row[j] ?? ''
    out.push(obj)
  }
  return out
}

function csvParse(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let i = 0
  let inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cur += ch
      i += 1
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (ch === ',') {
      row.push(cur)
      cur = ''
      i += 1
      continue
    }
    if (ch === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
      i += 1
      continue
    }
    if (ch === '\r') {
      i += 1
      continue
    }
    cur += ch
    i += 1
  }
  row.push(cur)
  if (row.length > 1 || row[0] !== '') rows.push(row)
  return rows
}

type Upsert = {
  sql: string
  bind: (row: Record<string, unknown>) => unknown[]
}

function upsertStmt(entity: Entity): Upsert {
  if (entity === 'categories') {
    return {
      sql: 'INSERT INTO categories (id, parent_id, name, slug, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,name=excluded.name,slug=excluded.slug,sort_order=excluded.sort_order,updated_at=excluded.updated_at',
      bind: (r) => [r.id, r.parent_id, r.name, r.slug, r.sort_order, r.created_at, r.updated_at]
    }
  }
  if (entity === 'countries') {
    return {
      sql: 'INSERT INTO countries (id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET iso2=excluded.iso2,name=excluded.name,slug=excluded.slug,hero_image_key=excluded.hero_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,countries.published_at),updated_at=excluded.updated_at',
      bind: (r) => [
        r.id,
        r.iso2,
        r.name,
        r.slug,
        r.hero_image_key,
        r.seo_title,
        r.seo_description,
        r.content_html,
        r.faq_json,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    }
  }
  if (entity === 'operators') {
    return {
      sql: 'INSERT INTO operators (id, name, slug, website_url, logo_image_key, support_channels_json, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,website_url=excluded.website_url,logo_image_key=excluded.logo_image_key,support_channels_json=excluded.support_channels_json,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,operators.published_at),updated_at=excluded.updated_at',
      bind: (r) => [
        r.id,
        r.name,
        r.slug,
        r.website_url,
        r.logo_image_key,
        r.support_channels_json,
        r.seo_title,
        r.seo_description,
        r.content_html,
        r.faq_json,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    }
  }
  if (entity === 'products') {
    return {
      sql: 'INSERT INTO products (id, operator_id, category_id, country_iso2, name, slug, data_gb, days, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, coverage_regions_json, activation_guide_html, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET operator_id=excluded.operator_id,category_id=excluded.category_id,country_iso2=excluded.country_iso2,name=excluded.name,slug=excluded.slug,data_gb=excluded.data_gb,days=excluded.days,is_unlimited=excluded.is_unlimited,supports_hotspot=excluded.supports_hotspot,network_type=excluded.network_type,price_amount=excluded.price_amount,price_currency=excluded.price_currency,purchase_url=excluded.purchase_url,coverage_regions_json=excluded.coverage_regions_json,activation_guide_html=excluded.activation_guide_html,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,products.published_at),updated_at=excluded.updated_at',
      bind: (r) => [
        r.id,
        r.operator_id,
        r.category_id,
        r.country_iso2,
        r.name,
        r.slug,
        r.data_gb,
        r.days,
        r.is_unlimited,
        r.supports_hotspot,
        r.network_type,
        r.price_amount,
        r.price_currency,
        r.purchase_url,
        r.coverage_regions_json,
        r.activation_guide_html,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    }
  }
  return {
    sql: 'INSERT INTO posts (id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,post_type=excluded.post_type,ref_slug=excluded.ref_slug,title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content_html=excluded.content_html,cover_image_key=excluded.cover_image_key,locale=excluded.locale,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,posts.published_at),updated_at=excluded.updated_at',
    bind: (r) => [
      r.id,
      r.category_id,
      r.post_type,
      r.ref_slug,
      r.title,
      r.slug,
      r.excerpt,
      r.content_html,
      r.cover_image_key,
      r.locale,
      r.status,
      r.publish_at,
      r.published_at,
      r.created_at,
      r.updated_at
    ]
  }
}

function normalize(entity: Entity, item: Record<string, unknown>, now: string): Record<string, unknown> | null {
  const id = asStr(item.id) || ulid()
  if (entity === 'categories') {
    const name = asStr(item.name)
    const slug = asStr(item.slug)
    if (!name || !slug) return null
    return {
      id,
      parent_id: asStr(item.parent_id) || null,
      name,
      slug,
      sort_order: toInt(item.sort_order) ?? 0,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    }
  }
  if (entity === 'countries') {
    const iso2 = (asStr(item.iso2) || '').toLowerCase().trim()
    const name = asStr(item.name)
    const slug = asStr(item.slug)
    if (!iso2 || !name || !slug) return null
    return {
      id,
      iso2,
      name,
      slug,
      hero_image_key: asStr(item.hero_image_key) || null,
      seo_title: asStr(item.seo_title) || null,
      seo_description: asStr(item.seo_description) || null,
      content_html: asStr(item.content_html) || null,
      faq_json: asStr(item.faq_json) || '[]',
      status: asStr(item.status) || 'draft',
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    }
  }
  if (entity === 'operators') {
    const name = asStr(item.name)
    const slug = asStr(item.slug)
    const website_url = asStr(item.website_url)
    if (!name || !slug || !website_url) return null
    return {
      id,
      name,
      slug,
      website_url,
      logo_image_key: asStr(item.logo_image_key) || null,
      support_channels_json: asStr(item.support_channels_json) || null,
      seo_title: asStr(item.seo_title) || null,
      seo_description: asStr(item.seo_description) || null,
      content_html: asStr(item.content_html) || null,
      faq_json: asStr(item.faq_json) || '[]',
      status: asStr(item.status) || 'draft',
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    }
  }
  if (entity === 'products') {
    const operator_id = asStr(item.operator_id)
    const name = asStr(item.name)
    const slug = asStr(item.slug)
    const country_iso2 = (asStr(item.country_iso2) || '').toLowerCase().trim()
    const days = toInt(item.days)
    const price_amount = toNum(item.price_amount)
    const price_currency = (asStr(item.price_currency) || '').toUpperCase().trim()
    const purchase_url = asStr(item.purchase_url)
    if (!operator_id || !name || !slug || !country_iso2 || !days || price_amount == null || !price_currency || !purchase_url) return null
    return {
      id,
      operator_id,
      category_id: asStr(item.category_id) || null,
      country_iso2,
      name,
      slug,
      data_gb: toNum(item.data_gb),
      days,
      is_unlimited: toInt(item.is_unlimited) ?? 0,
      supports_hotspot: toInt(item.supports_hotspot) ?? 1,
      network_type: asStr(item.network_type) || null,
      price_amount,
      price_currency,
      purchase_url,
      coverage_regions_json: asStr(item.coverage_regions_json) || null,
      activation_guide_html: asStr(item.activation_guide_html) || null,
      status: asStr(item.status) || 'draft',
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    }
  }
  const title = asStr(item.title)
  const slug = asStr(item.slug)
  const content_html = asStr(item.content_html)
  if (!title || !slug || !content_html) return null
  return {
    id,
    category_id: asStr(item.category_id) || null,
    post_type: asStr(item.post_type) || 'guide',
    ref_slug: asStr(item.ref_slug) || null,
    title,
    slug,
    excerpt: asStr(item.excerpt) || null,
    content_html,
    cover_image_key: asStr(item.cover_image_key) || null,
    locale: asStr(item.locale) || 'en',
    status: asStr(item.status) || 'draft',
    publish_at: asStr(item.publish_at) || null,
    published_at: asStr(item.published_at) || null,
    created_at: asStr(item.created_at) || now,
    updated_at: now
  }
}

function asStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

function toInt(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) ? n : null
}

function toNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
}

