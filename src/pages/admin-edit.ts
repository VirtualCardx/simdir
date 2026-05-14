import type { Bindings } from '../env'
import { requireAdmin } from '../lib/auth'
import { dbAll, dbGet } from '../lib/db'
import { html, redirect, badRequest, unauthorized } from '../lib/http'
import { nowIso, ulid } from '../lib/ids'
import { escapeHtml } from '../lib/seo'
import { criticalCss, layout } from '../lib/templates'
import { mediaUrl, putObject } from '../lib/media'
import { languageSwitchHref, pick, resolveLocale, type SiteLocale } from '../lib/i18n'

type CountryRow = {
  id: string
  iso2: string
  name: string
  slug: string
  hero_image_key: string | null
  seo_title: string | null
  seo_description: string | null
  content_html: string | null
  faq_json: string | null
  status: string
  publish_at: string | null
}

type OperatorRow = {
  id: string
  name: string
  slug: string
  website_url: string
  logo_image_key: string | null
  seo_title: string | null
  seo_description: string | null
  content_html: string | null
  faq_json: string | null
  status: string
  publish_at: string | null
}

type ProductRow = {
  id: string
  operator_id: string
  name: string
  slug: string
  country_iso2: string
  days: number
  data_gb: number | null
  is_unlimited: number
  supports_hotspot: number
  network_type: string | null
  price_amount: number
  price_currency: string
  purchase_url: string
  activation_guide_html: string | null
  status: string
  publish_at: string | null
}

type CategoryRow = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  sort_order: number
}

type PostRow = {
  id: string
  category_id: string | null
  post_type: string
  ref_slug: string | null
  title: string
  slug: string
  excerpt: string | null
  content_html: string
  cover_image_key: string | null
  locale: string
  status: string
  publish_at: string | null
}

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

function statusOptions(selected: string): string {
  const items: Array<[string, string]> = [
    ['draft', '草稿'],
    ['scheduled', '定时发布'],
    ['published', '已发布'],
    ['archived', '已归档']
  ]
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')
}

function localeOptions(selected: string): string {
  const items: Array<[string, string]> = [
    ['zh', '中文'],
    ['en', 'English']
  ]
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)} (${escapeHtml(value)})</option>`).join('')
}

function sanitizeHtmlBasic(input: string): string {
  const noScript = input.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
  const noOnAttrs = noScript.replace(/\son\w+\s*=\s*"[^"]*"/gi, '').replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  const noJsHref = noOnAttrs
    .replace(/\shref\s*=\s*"\s*javascript:[^"]*"/gi, ' href="#"')
    .replace(/\shref\s*=\s*'\s*javascript:[^']*'/gi, " href='#'")
  return noJsHref
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

async function ensureUniqueSlug(env: Bindings, table: string, slug: string, entityId: string): Promise<void> {
  const row = await env.DB.prepare(`SELECT id FROM ${table} WHERE slug=? AND id<>? LIMIT 1`).bind(slug, entityId).first<{ id: string }>()
  if (row) throw new Error('Slug already exists')
}

async function ensureUniqueCountryIso2(env: Bindings, iso2: string, entityId: string): Promise<void> {
  const row = await env.DB.prepare('SELECT id FROM countries WHERE iso2=? AND id<>? LIMIT 1').bind(iso2, entityId).first<{ id: string }>()
  if (row) throw new Error('ISO2 already exists')
}

async function ensureR2KeyExists(env: Bindings, key: string): Promise<void> {
  const head = await env.R2.head(key)
  if (!head) throw new Error('R2 object not found')
}

async function ensureExists(env: Bindings, sql: string, params: unknown[], message: string): Promise<void> {
  const row = await env.DB.prepare(sql).bind(...params).first<{ ok: string }>()
  if (!row) throw new Error(message)
}

function ensureJson(value: string, message: string): void {
  if (!value.trim()) return
  JSON.parse(value)
}

async function writeAudit(env: Bindings, actorUserId: string, action: string, entityType: string, entityId: string, detail: unknown): Promise<void> {
  await env.DB.prepare('INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, detail_json, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(ulid(), actorUserId, action, entityType, entityId, JSON.stringify(detail ?? null), nowIso())
    .run()
}

function toPublishedAt(status: string, now: string): string | null {
  if (status !== 'published') return null
  return now
}

function parseIsoOrNull(s: string): string | null {
  const t = s.trim()
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) throw new Error('Invalid publish_at')
  return d.toISOString()
}

function editorBlock(field: string, label: string, value: string): string {
  const id = `f_${field}`
  const editorId = `e_${field}`
  const toolbarId = `t_${field}`
  return `
    <label><small>${escapeHtml(label)}</small></label>
    <div id="${escapeHtml(toolbarId)}" class="toolbar">
      <button class="btn" type="button" data-cmd="bold">B</button>
      <button class="btn" type="button" data-cmd="italic">I</button>
      <button class="btn" type="button" data-cmd="insertUnorderedList">• List</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h2">H2</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h3">H3</button>
      <button class="btn" type="button" data-cmd="createLink">Link</button>
      <button class="btn" type="button" data-cmd="insertImage">Image</button>
    </div>
    <div id="${escapeHtml(editorId)}" contenteditable="true" class="input" style="min-height:220px;white-space:normal"></div>
    <textarea id="${escapeHtml(id)}" class="input" name="${escapeHtml(field)}" style="display:none" rows="10">${escapeHtml(value)}</textarea>
    <script>
      (() => {
        const editor = document.getElementById(${JSON.stringify(editorId)})
        const textarea = document.getElementById(${JSON.stringify(id)})
        const toolbar = document.getElementById(${JSON.stringify(toolbarId)})
        if (!(editor && textarea && toolbar)) return
        editor.innerHTML = textarea.value || ''
        const sync = () => { textarea.value = editor.innerHTML }
        editor.addEventListener('input', sync)
        toolbar.addEventListener('click', (e) => {
          const t = e.target
          if (!(t instanceof HTMLElement)) return
          const cmd = t.getAttribute('data-cmd')
          if (!cmd) return
          e.preventDefault()
          if (cmd === 'createLink') {
            const url = prompt('URL')
            if (!url) return
            document.execCommand('createLink', false, url)
            sync();
            return
          }
          if (cmd === 'insertImage') {
            const url = prompt('Image URL')
            if (!url) return
            document.execCommand('insertImage', false, url)
            sync();
            return
          }
          const arg = t.getAttribute('data-arg')
          document.execCommand(cmd, false, arg)
          sync()
        })
        const form = editor.closest('form')
        if (form) form.addEventListener('submit', sync)
      })()
    </script>
  `
}

function jsonTextarea(field: string, label: string, value: string, rows: number): string {
  return `<label><small>${escapeHtml(label)}</small><textarea class="input" name="${escapeHtml(field)}" rows="${rows}">${escapeHtml(value)}</textarea></label>`
}

export async function adminEditCategoryPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const row = isNew
    ? null
    : await dbGet<CategoryRow>(
        env.DB,
        'SELECT id, parent_id, name, slug, sort_order FROM categories WHERE id=?',
        [id]
      )
  if (!isNew && !row) return redirect('/admin/categories')

  const parents = await dbAll<{ id: string; name: string; slug: string }>(env.DB, 'SELECT id, name, slug FROM categories ORDER BY name ASC LIMIT 1000')
  const canonical = new URL(isNew ? '/admin/categories/new' : `/admin/categories/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const v = row ?? { id: '', parent_id: null, name: '', slug: '', sort_order: 0 }
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? '新增分类' : '编辑分类'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>分类信息已保存。</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/categories/new' : `/admin/categories/${escapeHtml(String(id))}`}">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>sort_order</small><input class="input" name="sort_order" type="number" value="${escapeHtml(String(v.sort_order ?? 0))}"></label>
          <label><small>parent</small>
            <select class="input" name="parent_id">
              <option value="">(无)</option>
              ${parents
                .filter((p) => (isNew ? true : p.id !== id))
                .map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === v.parent_id ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(p.slug)})</option>`)
                .join('')}
            </select>
          </label>
        </div>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存</button>
        <a class="btn" href="/admin/categories">返回列表</a>
      </form>
    </section>
  </main>
  `
  return html(
    layout({ title: `分类编辑 | ${env.SITE_NAME}`, description: '后台编辑', canonical, robots: 'noindex, nofollow' }, body, criticalCss()),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSaveCategory(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const entityId = id ?? ulid()
  const now = nowIso()
  const name = String(form.get('name') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const sortOrder = parseInt(String(form.get('sort_order') ?? '0'), 10)
  const parentId = String(form.get('parent_id') ?? '').trim() || null
  if (!name || !slug) return redirect(entityEditLocation('categories', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('categories', id, entityId, 'Invalid slug'))
  if (!Number.isFinite(sortOrder)) return redirect(entityEditLocation('categories', id, entityId, 'Invalid sort_order'))

  const existing = await env.DB.prepare('SELECT id, parent_id, name, slug, sort_order FROM categories WHERE id=?').bind(entityId).first<CategoryRow>()
  if (existing) await writeRevision(env, user.userId, 'categories', entityId, existing)

  try {
    await ensureUniqueSlug(env, 'categories', slug, entityId)
  } catch (e) {
    return redirect(entityEditLocation('categories', id, entityId, (e as Error).message))
  }
  await env.DB.prepare(
    'INSERT INTO categories (id, parent_id, name, slug, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,name=excluded.name,slug=excluded.slug,sort_order=excluded.sort_order,updated_at=excluded.updated_at'
  )
    .bind(entityId, parentId, name, slug, sortOrder, now, now)
    .run()
  await writeAudit(env, user.userId, id ? 'update' : 'create', 'categories', entityId, { slug })
  return redirect(`/admin/categories/${entityId}?success=saved`)
}

async function writeRevision(env: Bindings, actorUserId: string, entityType: string, entityId: string, snapshot: unknown): Promise<void> {
  const row = await env.DB.prepare('SELECT MAX(version) as v FROM revisions WHERE entity_type=? AND entity_id=?')
    .bind(entityType, entityId)
    .first<{ v: number | null }>()
  const nextVersion = (row?.v ?? 0) + 1
  await env.DB.prepare(
    'INSERT INTO revisions (id, entity_type, entity_id, version, snapshot_json, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)'
  )
    .bind(ulid(), entityType, entityId, nextVersion, JSON.stringify(snapshot), actorUserId, nowIso())
    .run()
}

export async function adminEditCountryPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const row = isNew
    ? null
    : await dbGet<CountryRow>(
        env.DB,
        'SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM countries WHERE id=?',
        [id]
      )
  if (!isNew && !row) return redirect('/admin/countries')

  const canonical = new URL(isNew ? '/admin/countries/new' : `/admin/countries/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const v = row ?? {
    id: '',
    iso2: '',
    name: '',
    slug: '',
    hero_image_key: null,
    seo_title: '',
    seo_description: '',
    content_html: '',
    faq_json: '[]',
    status: 'draft',
    publish_at: null
  }
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? '新增国家' : '编辑国家'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_image' ? '国家信息已保存，头图已上传并绑定到当前记录。' : '国家信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/countries/new' : `/admin/countries/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>ISO2</small><input class="input" name="iso2" value="${escapeHtml(v.iso2)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601，可空)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? '')}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_hero_image_key" value="${escapeHtml(v.hero_image_key ?? '')}">
        <label><small>国家头图上传到 R2</small><input class="input" type="file" name="hero_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === '1' ? `<p><small class="hint-success">本次已上传新的国家头图。</small></p>` : ''}
        ${v.hero_image_key ? `<div style="height:8px"></div><p><small>当前 R2 key：</small> <code>${escapeHtml(v.hero_image_key)}</code></p>` : '<p><small>未上传头图，保存时如选择图片将自动生成 R2 key。</small></p>'}
        <div style="height:8px"></div>
        <img id="country-hero-preview" src="${escapeHtml(v.hero_image_key ? mediaUrl(env.APP_ORIGIN, v.hero_image_key) : '')}" alt="${escapeHtml(v.name || v.slug)}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.hero_image_key ? '' : 'display:none;'}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="hero_file"]')
            const preview = document.getElementById('country-hero-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              preview.src = URL.createObjectURL(file)
              preview.style.display = 'block'
            })
          })()
        </script>
        <div style="height:12px"></div>
        <label><small>seo_title</small><input class="input" name="seo_title" value="${escapeHtml(v.seo_title ?? '')}"></label>
        <div style="height:12px"></div>
        <label><small>seo_description</small><input class="input" name="seo_description" value="${escapeHtml(v.seo_description ?? '')}"></label>
        <div style="height:12px"></div>
        ${editorBlock('content_html', 'content_html', v.content_html ?? '')}
        <div style="height:12px"></div>
        ${jsonTextarea('faq_json', 'faq_json (FAQPage mainEntity 数组 JSON)', v.faq_json ?? '[]', 6)}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存</button>
        <a class="btn" href="/admin/countries">返回列表</a>
      </form>
    </section>
  </main>
  `
  return html(
    layout(
      { title: `国家编辑 | ${env.SITE_NAME}`, description: '后台编辑', canonical, robots: 'noindex, nofollow' },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSaveCountry(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const entityId = id ?? ulid()
  const now = nowIso()
  const iso2 = String(form.get('iso2') ?? '').toLowerCase().trim()
  const name = String(form.get('name') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAt = String(form.get('publish_at') ?? '').trim() || null
  const currentHero = String(form.get('current_hero_image_key') ?? '').trim() || null
  const heroFile = form.get('hero_file')
  const seoTitle = String(form.get('seo_title') ?? '').trim() || null
  const seoDesc = String(form.get('seo_description') ?? '').trim() || null
  const contentHtml = sanitizeHtmlBasic(String(form.get('content_html') ?? '').trim()) || null
  const faqJson = String(form.get('faq_json') ?? '').trim() || '[]'
  if (!iso2 || !name || !slug) return redirect(entityEditLocation('countries', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('countries', id, entityId, 'Invalid slug'))

  const existing = await env.DB.prepare('SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM countries WHERE id=?')
    .bind(entityId)
    .first<CountryRow>()
  if (existing) await writeRevision(env, user.userId, 'countries', entityId, existing)

  let hero = currentHero ?? existing?.hero_image_key ?? null
  let uploadedNewHero = false
  if (heroFile instanceof File && heroFile.size > 0) {
    try {
      hero = await uploadImageToR2(env, heroFile, 'countries/heroes', 'Country hero')
      uploadedNewHero = true
    } catch (e) {
      return redirect(entityEditLocation('countries', id, entityId, (e as Error).message))
    }
  }

  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(entityEditLocation('countries', id, entityId, 'publish_at required for scheduled'))
    await ensureUniqueSlug(env, 'countries', slug, entityId)
    await ensureUniqueCountryIso2(env, iso2, entityId)
    if (status === 'published' || status === 'scheduled') ensureJson(faqJson, 'Invalid faq_json')
    if ((status === 'published' || status === 'scheduled') && hero) await ensureR2KeyExists(env, hero)
  } catch (e) {
    return redirect(entityEditLocation('countries', id, entityId, (e as Error).message))
  }

  const publishedAt = toPublishedAt(status, now)
  await env.DB.prepare(
    'INSERT INTO countries (id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET iso2=excluded.iso2,name=excluded.name,slug=excluded.slug,hero_image_key=excluded.hero_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,countries.published_at),updated_at=excluded.updated_at'
  )
    .bind(entityId, iso2, name, slug, hero, seoTitle, seoDesc, contentHtml, faqJson, status, publishAt, publishedAt, now, now)
    .run()

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'countries', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'countries', entityId, { published_at: now })

  return redirect(`/admin/countries/${entityId}?success=${uploadedNewHero ? 'saved_with_image' : 'saved'}${uploadedNewHero ? '&uploaded=1' : ''}`)
}

export async function adminEditOperatorPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const row = isNew
    ? null
    : await dbGet<OperatorRow>(
        env.DB,
        'SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM operators WHERE id=?',
        [id]
      )
  if (!isNew && !row) return redirect('/admin/operators')

  const canonical = new URL(isNew ? '/admin/operators/new' : `/admin/operators/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const v = row ?? {
    id: '',
    name: '',
    slug: '',
    website_url: '',
    logo_image_key: null,
    seo_title: '',
    seo_description: '',
    content_html: '',
    faq_json: '[]',
    status: 'draft',
    publish_at: null
  }
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? '新增供应商' : '编辑供应商'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_logo' ? '供应商信息已保存，logo 已上传并绑定到当前记录。' : '供应商信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/operators/new' : `/admin/operators/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>website_url</small><input class="input" name="website_url" value="${escapeHtml(v.website_url)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601，可空)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? '')}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_logo_image_key" value="${escapeHtml(v.logo_image_key ?? '')}">
        <label><small>logo 上传到 R2</small><input class="input" type="file" name="logo_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === '1' ? `<p><small class="hint-success">本次已上传新的 logo 图片。</small></p>` : ''}
        ${v.logo_image_key ? `<div style="height:8px"></div><p><small>当前 R2 key：</small> <code>${escapeHtml(v.logo_image_key)}</code></p>` : '<p><small>未上传 logo，保存时如选择图片将自动生成 R2 key。</small></p>'}
        <div style="height:8px"></div>
        <img id="operator-logo-preview" src="${escapeHtml(v.logo_image_key ? mediaUrl(env.APP_ORIGIN, v.logo_image_key) : '')}" alt="${escapeHtml(v.name || v.slug)} logo" width="96" height="96" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.logo_image_key ? '' : 'display:none;'}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="logo_file"]')
            const preview = document.getElementById('operator-logo-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              const url = URL.createObjectURL(file)
              preview.src = url
              preview.style.display = 'block'
            })
          })()
        </script>
        <div style="height:12px"></div>
        <label><small>seo_title</small><input class="input" name="seo_title" value="${escapeHtml(v.seo_title ?? '')}"></label>
        <div style="height:12px"></div>
        <label><small>seo_description</small><input class="input" name="seo_description" value="${escapeHtml(v.seo_description ?? '')}"></label>
        <div style="height:12px"></div>
        ${editorBlock('content_html', 'content_html', v.content_html ?? '')}
        <div style="height:12px"></div>
        ${jsonTextarea('faq_json', 'faq_json (FAQPage mainEntity 数组 JSON)', v.faq_json ?? '[]', 6)}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存</button>
        <a class="btn" href="/admin/operators">返回列表</a>
      </form>
    </section>
  </main>
  `
  return html(
    layout(
      { title: `供应商编辑 | ${env.SITE_NAME}`, description: '后台编辑', canonical, robots: 'noindex, nofollow' },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSaveOperator(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const entityId = id ?? ulid()
  const now = nowIso()
  const name = String(form.get('name') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const websiteUrl = String(form.get('website_url') ?? '').trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAt = String(form.get('publish_at') ?? '').trim() || null
  const currentLogo = String(form.get('current_logo_image_key') ?? '').trim() || null
  const logoFile = form.get('logo_file')
  const seoTitle = String(form.get('seo_title') ?? '').trim() || null
  const seoDesc = String(form.get('seo_description') ?? '').trim() || null
  const contentHtml = sanitizeHtmlBasic(String(form.get('content_html') ?? '').trim()) || null
  const faqJson = String(form.get('faq_json') ?? '').trim() || '[]'
  if (!name || !slug || !websiteUrl) return redirect(operatorEditLocation(id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(operatorEditLocation(id, entityId, 'Invalid slug'))
  if (!isValidUrl(websiteUrl)) return redirect(operatorEditLocation(id, entityId, 'Invalid website_url'))

  const existing = await env.DB.prepare(
    'SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM operators WHERE id=?'
  )
    .bind(entityId)
    .first<OperatorRow>()
  if (existing) await writeRevision(env, user.userId, 'operators', entityId, existing)

  let logo = currentLogo ?? existing?.logo_image_key ?? null
  let uploadedNewLogo = false
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logo = await uploadOperatorLogo(env, logoFile)
      uploadedNewLogo = true
    } catch (e) {
      return redirect(operatorEditLocation(id, entityId, (e as Error).message))
    }
  }

  const publishedAt = toPublishedAt(status, now)
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(operatorEditLocation(id, entityId, 'publish_at required for scheduled'))
    await ensureUniqueSlug(env, 'operators', slug, entityId)
    if (status === 'published' || status === 'scheduled') ensureJson(faqJson, 'Invalid faq_json')
    if ((status === 'published' || status === 'scheduled') && logo) await ensureR2KeyExists(env, logo)
  } catch (e) {
    return redirect(operatorEditLocation(id, entityId, (e as Error).message))
  }
  await env.DB.prepare(
    'INSERT INTO operators (id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,website_url=excluded.website_url,logo_image_key=excluded.logo_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,operators.published_at),updated_at=excluded.updated_at'
  )
    .bind(entityId, name, slug, websiteUrl, logo, seoTitle, seoDesc, contentHtml, faqJson, status, publishAt, publishedAt, now, now)
    .run()

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'operators', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'operators', entityId, { published_at: now })

  return redirect(`/admin/operators/${entityId}?success=${uploadedNewLogo ? 'saved_with_logo' : 'saved'}${uploadedNewLogo ? '&uploaded=1' : ''}`)
}

export async function adminEditProductPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const row = isNew
    ? null
    : await dbGet<ProductRow>(
        env.DB,
        'SELECT id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at FROM products WHERE id=?',
        [id]
      )
  if (!isNew && !row) return redirect('/admin/products')

  const operators = await dbAll<{ id: string; name: string; slug: string }>(
    env.DB,
    "SELECT id, name, slug FROM operators ORDER BY name ASC LIMIT 500"
  )
  const operatorId = row?.operator_id ?? (operators[0]?.id ?? '')

  const canonical = new URL(isNew ? '/admin/products/new' : `/admin/products/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const v = row ?? {
    id: '',
    operator_id: operatorId,
    name: '',
    slug: '',
    country_iso2: '',
    days: 7,
    data_gb: null,
    is_unlimited: 0,
    supports_hotspot: 1,
    network_type: '5G',
    price_amount: 0,
    price_currency: 'USD',
    purchase_url: '',
    activation_guide_html: '',
    status: 'draft',
    publish_at: null
  }

  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? '新增套餐' : '编辑套餐'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>套餐信息已保存。</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/products/new' : `/admin/products/${escapeHtml(String(id))}`}">
        <label><small>operator</small>
          <select class="input" name="operator_id">${operators
            .map((o) => `<option value="${escapeHtml(o.id)}" ${o.id === v.operator_id ? 'selected' : ''}>${escapeHtml(o.name)} (${escapeHtml(o.slug)})</option>`)
            .join('')}</select>
        </label>
        <div style="height:12px"></div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>country_iso2</small><input class="input" name="country_iso2" value="${escapeHtml(v.country_iso2)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
          <label><small>days</small><input class="input" name="days" type="number" min="1" value="${escapeHtml(String(v.days))}" required></label>
          <label><small>data_gb</small><input class="input" name="data_gb" type="number" step="0.1" value="${escapeHtml(v.data_gb == null ? '' : String(v.data_gb))}"></label>
          <label><small>is_unlimited</small><select class="input" name="is_unlimited"><option value="0" ${v.is_unlimited ? '' : 'selected'}>false</option><option value="1" ${v.is_unlimited ? 'selected' : ''}>true</option></select></label>
          <label><small>supports_hotspot</small><select class="input" name="supports_hotspot"><option value="0" ${v.supports_hotspot ? '' : 'selected'}>false</option><option value="1" ${v.supports_hotspot ? 'selected' : ''}>true</option></select></label>
          <label><small>network_type</small><input class="input" name="network_type" value="${escapeHtml(v.network_type ?? '')}"></label>
          <label><small>price_amount</small><input class="input" name="price_amount" type="number" step="0.01" value="${escapeHtml(String(v.price_amount))}" required></label>
          <label><small>price_currency</small><input class="input" name="price_currency" value="${escapeHtml(v.price_currency)}" required></label>
        </div>
        <div style="height:12px"></div>
        <label><small>purchase_url</small><input class="input" name="purchase_url" value="${escapeHtml(v.purchase_url)}" required></label>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601，可空)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? '')}"></label>
        <div style="height:12px"></div>
        ${editorBlock('activation_guide_html', 'activation_guide_html', v.activation_guide_html ?? '')}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存</button>
        <a class="btn" href="/admin/products">返回列表</a>
      </form>
    </section>
  </main>
  `
  return html(
    layout(
      { title: `套餐编辑 | ${env.SITE_NAME}`, description: '后台编辑', canonical, robots: 'noindex, nofollow' },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSaveProduct(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const entityId = id ?? ulid()
  const now = nowIso()

  const operatorId = String(form.get('operator_id') ?? '').trim()
  const name = String(form.get('name') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const countryIso2 = String(form.get('country_iso2') ?? '').toLowerCase().trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAt = String(form.get('publish_at') ?? '').trim() || null
  const days = parseInt(String(form.get('days') ?? '0'), 10)
  const dataGbStr = String(form.get('data_gb') ?? '').trim()
  const dataGb = dataGbStr ? Number(dataGbStr) : null
  const isUnlimited = String(form.get('is_unlimited') ?? '0') === '1' ? 1 : 0
  const supportsHotspot = String(form.get('supports_hotspot') ?? '1') === '1' ? 1 : 0
  const networkType = String(form.get('network_type') ?? '').trim() || null
  const priceAmount = Number(String(form.get('price_amount') ?? '0'))
  const priceCurrency = String(form.get('price_currency') ?? '').trim().toUpperCase()
  const purchaseUrl = String(form.get('purchase_url') ?? '').trim()
  const activation = sanitizeHtmlBasic(String(form.get('activation_guide_html') ?? '').trim()) || null
  if (!operatorId || !name || !slug || !countryIso2 || !purchaseUrl) return redirect(entityEditLocation('products', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('products', id, entityId, 'Invalid slug'))
  if (!isValidUrl(purchaseUrl)) return redirect(entityEditLocation('products', id, entityId, 'Invalid purchase_url'))
  if (!Number.isFinite(days) || days < 1) return redirect(entityEditLocation('products', id, entityId, 'Invalid days'))
  if (!Number.isFinite(priceAmount) || priceAmount < 0) return redirect(entityEditLocation('products', id, entityId, 'Invalid price'))
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(entityEditLocation('products', id, entityId, 'publish_at required for scheduled'))
    await ensureUniqueSlug(env, 'products', slug, entityId)
    if (status === 'published' || status === 'scheduled') {
      await ensureExists(env, 'SELECT id as ok FROM operators WHERE id=? LIMIT 1', [operatorId], 'Invalid operator_id')
      await ensureExists(env, 'SELECT id as ok FROM countries WHERE iso2=? LIMIT 1', [countryIso2], 'Invalid country_iso2')
    }
  } catch (e) {
    return redirect(entityEditLocation('products', id, entityId, (e as Error).message))
  }

  const existing = await env.DB.prepare(
    'SELECT id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at FROM products WHERE id=?'
  )
    .bind(entityId)
    .first<ProductRow>()
  if (existing) await writeRevision(env, user.userId, 'products', entityId, existing)

  const publishedAt = toPublishedAt(status, now)
  await env.DB.prepare(
    'INSERT INTO products (id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET operator_id=excluded.operator_id,name=excluded.name,slug=excluded.slug,country_iso2=excluded.country_iso2,days=excluded.days,data_gb=excluded.data_gb,is_unlimited=excluded.is_unlimited,supports_hotspot=excluded.supports_hotspot,network_type=excluded.network_type,price_amount=excluded.price_amount,price_currency=excluded.price_currency,purchase_url=excluded.purchase_url,activation_guide_html=excluded.activation_guide_html,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,products.published_at),updated_at=excluded.updated_at'
  )
    .bind(
      entityId,
      operatorId,
      name,
      slug,
      countryIso2,
      days,
      dataGb,
      isUnlimited,
      supportsHotspot,
      networkType,
      priceAmount,
      priceCurrency,
      purchaseUrl,
      activation,
      status,
      publishAt,
      publishedAt,
      now,
      now
    )
    .run()

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'products', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'products', entityId, { published_at: now })

  return redirect(`/admin/products/${entityId}?success=saved`)
}

export async function adminEditPostPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const categories = await dbAll<{ id: string; name: string; slug: string }>(env.DB, 'SELECT id, name, slug FROM categories ORDER BY sort_order ASC, name ASC LIMIT 1000')
  const row = isNew
    ? null
    : await dbGet<PostRow>(
        env.DB,
        'SELECT id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at FROM posts WHERE id=?',
        [id]
      )
  if (!isNew && !row) return redirect('/admin/posts')
  const canonical = new URL(isNew ? '/admin/posts/new' : `/admin/posts/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const v = row ?? {
    id: '',
    category_id: null,
    post_type: 'guide',
    ref_slug: null,
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    cover_image_key: null,
    locale: 'en',
    status: 'draft',
    publish_at: null
  }
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? '新增文章' : '编辑文章'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_image' ? '文章信息已保存，封面图已上传并绑定到当前记录。' : '文章信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card muted-panel">
      <div class="admin-actions">
        <a class="btn" href="/admin/posts">返回文章列表</a>
        <a class="btn" href="/admin/categories">管理文章分类</a>
        ${!isNew ? `<a class="btn" href="/post/${escapeHtml(v.slug)}" target="_blank" rel="noopener">预览公开页</a>` : ''}
      </div>
    </section>
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/posts/new' : `/admin/posts/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>文章标题</small><input class="input" name="title" value="${escapeHtml(v.title)}" required></label>
          <label><small>Slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>文章分类</small>
            <select class="input" name="category_id">
              <option value="">(未分类)</option>
              ${categories.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === v.category_id ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.slug)})</option>`).join('')}
            </select>
          </label>
          <label><small>文章语言</small><select class="input" name="locale">${localeOptions(v.locale)}</select></label>
          <label><small>关联 Slug（可空）</small><input class="input" name="ref_slug" value="${escapeHtml(v.ref_slug ?? '')}"></label>
          <label><small>发布状态</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>定时发布时间（ISO8601，可空）</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? '')}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_cover_image_key" value="${escapeHtml(v.cover_image_key ?? '')}">
        <label><small>封面图上传到 R2</small><input class="input" type="file" name="cover_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === '1' ? `<p><small class="hint-success">本次已上传新的封面图。</small></p>` : ''}
        ${v.cover_image_key ? `<div style="height:8px"></div><p><small>当前 R2 key：</small> <code>${escapeHtml(v.cover_image_key)}</code></p>` : '<p><small>未上传封面图，保存时如选择图片将自动生成 R2 key。</small></p>'}
        <div style="height:8px"></div>
        <img id="post-cover-preview" src="${escapeHtml(v.cover_image_key ? mediaUrl(env.APP_ORIGIN, v.cover_image_key) : '')}" alt="${escapeHtml(v.title || v.slug)}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.cover_image_key ? '' : 'display:none;'}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="cover_file"]')
            const preview = document.getElementById('post-cover-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              preview.src = URL.createObjectURL(file)
              preview.style.display = 'block'
            })
          })()
        </script>
        <div style="height:12px"></div>
        <label><small>文章摘要（可空）</small><textarea class="input" name="excerpt" rows="3">${escapeHtml(v.excerpt ?? '')}</textarea></label>
        <div style="height:12px"></div>
        ${editorBlock('content_html', '正文内容', v.content_html ?? '')}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存</button>
        <a class="btn" href="/admin/posts">返回文章列表</a>
      </form>
    </section>
  </main>
  `
  return html(
    layout({ title: `文章编辑 | ${env.SITE_NAME}`, description: '后台编辑', canonical, robots: 'noindex, nofollow' }, body, criticalCss()),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSavePost(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const entityId = id ?? ulid()
  const now = nowIso()

  const title = String(form.get('title') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const categoryId = String(form.get('category_id') ?? '').trim() || null
  const locale = String(form.get('locale') ?? '').trim() || 'en'
  const refSlug = String(form.get('ref_slug') ?? '').trim() || null
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAtRaw = String(form.get('publish_at') ?? '').trim() || null
  const currentCover = String(form.get('current_cover_image_key') ?? '').trim() || null
  const coverFile = form.get('cover_file')
  const excerpt = String(form.get('excerpt') ?? '').trim() || null
  const contentHtml = sanitizeHtmlBasic(String(form.get('content_html') ?? '').trim())
  if (!title || !slug || !contentHtml) return redirect(entityEditLocation('posts', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('posts', id, entityId, 'Invalid slug'))

  const existing = await env.DB.prepare(
    'SELECT id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at FROM posts WHERE id=?'
  )
    .bind(entityId)
    .first<PostRow>()
  const postType = existing?.post_type || 'guide'
  if (existing) await writeRevision(env, user.userId, 'posts', entityId, existing)

  let cover = currentCover ?? existing?.cover_image_key ?? null
  let uploadedNewCover = false
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      cover = await uploadImageToR2(env, coverFile, 'posts/covers', 'Post cover')
      uploadedNewCover = true
    } catch (e) {
      return redirect(entityEditLocation('posts', id, entityId, (e as Error).message))
    }
  }

  try {
    const parsedPublishAt = publishAtRaw ? parseIsoOrNull(publishAtRaw) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(entityEditLocation('posts', id, entityId, 'publish_at required for scheduled'))
    await ensureUniqueSlug(env, 'posts', slug, entityId)
    if (categoryId) await ensureExists(env, 'SELECT id as ok FROM categories WHERE id=? LIMIT 1', [categoryId], 'Invalid category_id')
    if ((status === 'published' || status === 'scheduled') && cover) await ensureR2KeyExists(env, cover)
  } catch (e) {
    return redirect(entityEditLocation('posts', id, entityId, (e as Error).message))
  }

  const publishedAt = toPublishedAt(status, now)
  await env.DB.prepare(
    'INSERT INTO posts (id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,post_type=excluded.post_type,ref_slug=excluded.ref_slug,title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content_html=excluded.content_html,cover_image_key=excluded.cover_image_key,locale=excluded.locale,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,posts.published_at),updated_at=excluded.updated_at'
  )
    .bind(entityId, categoryId, postType, refSlug, title, slug, excerpt, contentHtml, cover, locale, status, publishAtRaw, publishedAt, now, now)
    .run()

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'posts', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'posts', entityId, { published_at: now })
  return redirect(`/admin/posts/${entityId}?success=${uploadedNewCover ? 'saved_with_image' : 'saved'}${uploadedNewCover ? '&uploaded=1' : ''}`)
}

export async function adminMediaPage(env: Bindings, req: Request, uploadedKey?: string): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const canonical = new URL('/admin/media', env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = uploadedKey ? `<p><small>已上传：</small> <code>${escapeHtml(uploadedKey)}</code></p><p><a class="btn" href="${escapeHtml(mediaUrl(env.APP_ORIGIN, uploadedKey))}" target="_blank" rel="noopener">打开文件</a></p>` : ''
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>媒体库（最小可用）</h1>
    ${success ? `<section class="card notice success"><strong>上传成功</strong><p>媒体文件已上传到 R2。</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>上传失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="/admin/media" enctype="multipart/form-data">
        <label><small>选择文件</small><input class="input" type="file" name="file" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">上传到 R2</button>
      </form>
      <div style="height:12px"></div>
      ${uploaded}
    </section>
  </main>
  `
  return html(
    layout(
      { title: `媒体库 | ${env.SITE_NAME}`, description: '后台媒体', canonical, robots: 'noindex, nofollow' },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminMediaUpload(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return redirect('/admin/media?error=Invalid%20form')
  const file = form.get('file')
  if (!(file instanceof File)) return redirect('/admin/media?error=Missing%20file')
  if (file.size <= 0) return redirect('/admin/media?error=Empty%20file')
  if (file.size > 8 * 1024 * 1024) return redirect('/admin/media?error=File%20too%20large')
  const contentType = file.type || 'application/octet-stream'
  const ext = guessExt(file.name, contentType)
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${ulid()}${ext}`
  await putObject(env, key, await file.arrayBuffer(), contentType)
  return redirect(`/admin/media?success=uploaded&uploaded=${encodeURIComponent(key)}`)
}

function guessExt(name: string, contentType: string): string {
  const lower = name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot >= 0 ? lower.slice(dot) : ''
  if (ext && ext.length <= 8) return ext
  if (contentType === 'image/png') return '.png'
  if (contentType === 'image/jpeg') return '.jpg'
  if (contentType === 'image/webp') return '.webp'
  if (contentType === 'image/svg+xml') return '.svg'
  return ''
}

async function uploadOperatorLogo(env: Bindings, file: File): Promise<string> {
  return uploadImageToR2(env, file, 'operators/logos', 'Logo')
}

function operatorEditLocation(id: string | null, entityId: string, error: string): string {
  const base = id ? `/admin/operators/${entityId}` : '/admin/operators/new'
  return `${base}?error=${encodeURIComponent(error)}`
}

async function uploadImageToR2(env: Bindings, file: File, prefix: string, label: string): Promise<string> {
  if (file.size <= 0) throw new Error(`Empty ${label.toLowerCase()} file`)
  if (file.size > 8 * 1024 * 1024) throw new Error(`${label} file too large`)
  const contentType = file.type || 'application/octet-stream'
  if (!/^image\/(?:png|jpeg|webp|svg\+xml)$/i.test(contentType)) {
    throw new Error(`Unsupported ${label.toLowerCase()} image type`)
  }
  const ext = guessExt(file.name, contentType)
  const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${ulid()}${ext}`
  await putObject(env, key, await file.arrayBuffer(), contentType)
  return key
}

function entityEditLocation(entity: 'categories' | 'countries' | 'products' | 'posts', id: string | null, entityId: string, error: string): string {
  const base = id ? `/admin/${entity}/${entityId}` : `/admin/${entity}/new`
  return `${base}?error=${encodeURIComponent(error)}`
}

