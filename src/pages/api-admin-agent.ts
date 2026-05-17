import type { Bindings } from '../env'
import { and, desc, eq, like, ne, sql, type SQL } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from '../lib/db'
import { badRequest, json, unauthorized } from '../lib/http'
import { nowIso, ulid } from '../lib/ids'
import { mediaUrl, putObject } from '../lib/media'

type ManagedEntity = 'categories' | 'countries' | 'operators' | 'products' | 'posts'
type DashboardCounts = { total: number; published: number; draft: number; scheduled: number; archived: number }

const VALID_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived'])

function getBearerToken(req: Request): string {
  const header = req.headers.get('Authorization') ?? ''
  const prefix = 'Bearer '
  if (!header.startsWith(prefix)) return ''
  return header.slice(prefix.length).trim()
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  const max = Math.max(aBytes.length, bBytes.length)
  let diff = aBytes.length === bBytes.length ? 0 : 1
  for (let i = 0; i < max; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

function requireAgentToken(env: Bindings, req: Request): Response | null {
  const expected = env.ADMIN_API_BEARER_TOKEN?.trim()
  if (!expected) return json({ error: 'ADMIN_API_BEARER_TOKEN missing' }, { status: 503 })
  const received = getBearerToken(req)
  if (!received || !timingSafeEqual(received, expected)) {
    return unauthorized('Invalid Bearer token')
  }
  return null
}

function parseJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  return req.json<Record<string, unknown>>().catch(() => null)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asNullableString(value: unknown): string | null {
  const normalized = asString(value)
  return normalized || null
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function asInteger(value: unknown, fallback = 0): number {
  const n = asNumber(value, fallback)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function asFlag(value: unknown, fallback = false): number {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value ? 1 : 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return 1
    if (normalized === '0' || normalized === 'false' || normalized === 'no') return 0
  }
  return fallback ? 1 : 0
}

function asJsonString(value: unknown, fallback = '[]'): string {
  if (typeof value === 'string') return value.trim() || fallback
  if (value == null) return fallback
  return JSON.stringify(value)
}

function normalizeStatus(value: unknown): string {
  const status = asString(value) || 'draft'
  if (!VALID_STATUSES.has(status)) throw new Error('Invalid status')
  return status
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function parseIsoOrNull(value: unknown): string | null {
  const text = asString(value)
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid publish_at')
  return date.toISOString()
}

function normalizePublishedAt(status: string, now: string): string | null {
  if (status !== 'published') return null
  return now
}

function handleDbError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error'
  const normalized = message.toLowerCase()
  if (normalized.includes('unique constraint') || normalized.includes('already exists')) {
    return json({ error: message }, { status: 409 })
  }
  if (normalized.includes('invalid') || normalized.includes('missing') || normalized.includes('required')) {
    return badRequest(message)
  }
  return json({ error: message }, { status: 500 })
}

async function writeAgentAudit(env: Bindings, action: string, entityType: string, entityId: string | null, detail: unknown): Promise<void> {
  await getDb(env.DB).insert(schema.auditLogs).values({
    id: ulid(),
    actorUserId: 'agent_api',
    action,
    entityType,
    entityId,
    detailJson: JSON.stringify(detail ?? null),
    createdAt: nowIso()
  })
}

function getPagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(Math.max(asInteger(url.searchParams.get('limit'), 50), 1), 200)
  const offset = Math.max(asInteger(url.searchParams.get('offset'), 0), 0)
  return { limit, offset }
}

async function loadDashboardCounts(db: ReturnType<typeof getDb>, table: typeof schema.countries | typeof schema.operators | typeof schema.products): Promise<DashboardCounts> {
  const row = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when ${table.status}='published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${table.status}='draft' then 1 else 0 end)`,
      scheduled: sql<number>`sum(case when ${table.status}='scheduled' then 1 else 0 end)`,
      archived: sql<number>`sum(case when ${table.status}='archived' then 1 else 0 end)`
    })
    .from(table)
    .get()
  return {
    total: row?.total ?? 0,
    published: row?.published ?? 0,
    draft: row?.draft ?? 0,
    scheduled: row?.scheduled ?? 0,
    archived: row?.archived ?? 0
  }
}

async function loadPostDashboardCounts(db: ReturnType<typeof getDb>): Promise<DashboardCounts> {
  const grouped = db
    .select({
      articleKey: sql<string>`coalesce(nullif(${schema.posts.refSlug}, ''), ${schema.posts.slug})`,
      status: sql<string>`
        case
          when sum(case when ${schema.posts.status}='published' then 1 else 0 end) > 0 then 'published'
          when sum(case when ${schema.posts.status}='scheduled' then 1 else 0 end) > 0 then 'scheduled'
          when sum(case when ${schema.posts.status}='draft' then 1 else 0 end) > 0 then 'draft'
          else 'archived'
        end
      `.as('status')
    })
    .from(schema.posts)
    .groupBy(sql`coalesce(nullif(${schema.posts.refSlug}, ''), ${schema.posts.slug})`)
    .as('grouped_posts')

  const row = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when ${grouped.status}='published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${grouped.status}='draft' then 1 else 0 end)`,
      scheduled: sql<number>`sum(case when ${grouped.status}='scheduled' then 1 else 0 end)`,
      archived: sql<number>`sum(case when ${grouped.status}='archived' then 1 else 0 end)`
    })
    .from(grouped)
    .get()

  return {
    total: row?.total ?? 0,
    published: row?.published ?? 0,
    draft: row?.draft ?? 0,
    scheduled: row?.scheduled ?? 0,
    archived: row?.archived ?? 0
  }
}

export async function apiAdminAgentHealth(env: Bindings, req: Request): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  return json({
    ok: true,
    service: 'admin-agent-api',
    configured: Boolean(env.ADMIN_API_BEARER_TOKEN?.trim())
  })
}

export async function apiAdminAgentDashboard(env: Bindings, req: Request): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const db = getDb(env.DB)
  const [countries, operators, products, posts, categories] = await Promise.all([
    loadDashboardCounts(db, schema.countries),
    loadDashboardCounts(db, schema.operators),
    loadDashboardCounts(db, schema.products),
    loadPostDashboardCounts(db),
    db.select({ total: sql<number>`count(*)` }).from(schema.categories).get()
  ])
  return json({
    ok: true,
    dashboard: {
      countries,
      operators,
      products,
      posts,
      categories: { total: categories?.total ?? 0 }
    }
  })
}

export async function apiAdminAgentGetSettings(env: Bindings, req: Request): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const row = await getDb(env.DB)
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.id, 'default'))
    .limit(1)
    .get()
  return json({ ok: true, item: row ?? null })
}

export async function apiAdminAgentPutSettings(env: Bindings, req: Request): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const data = await parseJsonBody(req)
  if (!data) return badRequest('Invalid JSON')
  const siteTitleZh = asString(data.site_title_zh)
  const siteTitleEn = asString(data.site_title_en)
  if (!siteTitleZh || !siteTitleEn) return badRequest('site_title_zh and site_title_en are required')

  const now = nowIso()
  const record = {
    id: 'default',
    siteTitle: siteTitleZh || siteTitleEn,
    siteTitleZh,
    siteTitleEn,
    siteKeywords: asNullableString(data.site_keywords_zh) || asNullableString(data.site_keywords_en),
    siteKeywordsZh: asNullableString(data.site_keywords_zh),
    siteKeywordsEn: asNullableString(data.site_keywords_en),
    tagline: asNullableString(data.tagline_zh) || asNullableString(data.tagline_en),
    taglineZh: asNullableString(data.tagline_zh),
    taglineEn: asNullableString(data.tagline_en),
    logoImageKey: asNullableString(data.logo_image_key),
    faviconImageKey: asNullableString(data.favicon_image_key),
    updatedAt: now
  }

  try {
    await getDb(env.DB)
      .insert(schema.siteSettings)
      .values(record)
      .onConflictDoUpdate({
        target: schema.siteSettings.id,
        set: record
      })
    await writeAgentAudit(env, 'upsert', 'site_settings', 'default', { source: 'agent_api' })
    return json({ ok: true, item: record })
  } catch (error) {
    return handleDbError(error)
  }
}

function guessUploadExt(name: string, contentType: string): string {
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

export async function apiAdminAgentUploadMedia(env: Bindings, req: Request): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const file = form.get('file')
  if (!(file instanceof File)) return badRequest('Missing file')
  if (file.size <= 0) return badRequest('Empty file')
  if (file.size > 8 * 1024 * 1024) return badRequest('File too large')

  const contentType = file.type || 'application/octet-stream'
  const ext = guessUploadExt(file.name, contentType)
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${ulid()}${ext}`
  await putObject(env, key, await file.arrayBuffer(), contentType)
  await writeAgentAudit(env, 'upload', 'media', key, { content_type: contentType, size: file.size, source: 'agent_api' })
  return json({ ok: true, key, url: mediaUrl(env.APP_ORIGIN, key) })
}

export async function apiAdminAgentList(env: Bindings, req: Request, entity: ManagedEntity): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth

  const db = getDb(env.DB)
  const url = new URL(req.url)
  const { limit, offset } = getPagination(url)
  const status = asString(url.searchParams.get('status'))
  const locale = asString(url.searchParams.get('locale'))
  const slug = asString(url.searchParams.get('slug'))

  if (entity === 'categories') {
    const rows = await db
      .select()
      .from(schema.categories)
      .orderBy(desc(schema.categories.updatedAt))
      .limit(limit)
      .offset(offset)
    return json({ ok: true, items: rows })
  }

  if (entity === 'countries') {
    const where: SQL[] = []
    if (status) where.push(eq(schema.countries.status, status))
    if (slug) where.push(like(schema.countries.slug, `%${slug}%`))
    const rows = await db
      .select()
      .from(schema.countries)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(schema.countries.updatedAt))
      .limit(limit)
      .offset(offset)
    return json({ ok: true, items: rows })
  }

  if (entity === 'operators') {
    const where: SQL[] = []
    if (status) where.push(eq(schema.operators.status, status))
    if (slug) where.push(like(schema.operators.slug, `%${slug}%`))
    const rows = await db
      .select()
      .from(schema.operators)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(schema.operators.updatedAt))
      .limit(limit)
      .offset(offset)
    return json({ ok: true, items: rows })
  }

  if (entity === 'products') {
    const where: SQL[] = []
    if (status) where.push(eq(schema.products.status, status))
    if (slug) where.push(like(schema.products.slug, `%${slug}%`))
    const rows = await db
      .select()
      .from(schema.products)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(schema.products.updatedAt))
      .limit(limit)
      .offset(offset)
    return json({ ok: true, items: rows })
  }

  const where: SQL[] = []
  if (status) where.push(eq(schema.posts.status, status))
  if (locale) where.push(like(schema.posts.locale, `${locale}%`))
  if (slug) where.push(like(schema.posts.slug, `%${slug}%`))
  const rows = await db
    .select()
    .from(schema.posts)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.posts.updatedAt))
    .limit(limit)
    .offset(offset)
  return json({ ok: true, items: rows })
}

export async function apiAdminAgentGet(env: Bindings, req: Request, entity: ManagedEntity, id: string): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const db = getDb(env.DB)

  const item = entity === 'categories'
    ? await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1).get()
    : entity === 'countries'
      ? await db.select().from(schema.countries).where(eq(schema.countries.id, id)).limit(1).get()
      : entity === 'operators'
        ? await db.select().from(schema.operators).where(eq(schema.operators.id, id)).limit(1).get()
        : entity === 'products'
          ? await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1).get()
          : await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1).get()

  if (!item) return json({ error: 'Not found' }, { status: 404 })
  return json({ ok: true, item })
}

export async function apiAdminAgentDelete(env: Bindings, req: Request, entity: ManagedEntity, id: string): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const db = getDb(env.DB)

  try {
    if (entity === 'categories') {
      await db.delete(schema.categories).where(eq(schema.categories.id, id))
    } else if (entity === 'countries') {
      await db.delete(schema.countries).where(eq(schema.countries.id, id))
    } else if (entity === 'operators') {
      await db.delete(schema.operators).where(eq(schema.operators.id, id))
    } else if (entity === 'products') {
      await db.delete(schema.products).where(eq(schema.products.id, id))
    } else {
      await db.delete(schema.posts).where(eq(schema.posts.id, id))
    }
    await writeAgentAudit(env, 'delete', entity, id, { source: 'agent_api' })
    return json({ ok: true, deleted: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

async function saveCategory(env: Bindings, id: string, data: Record<string, unknown>): Promise<Response> {
  const db = getDb(env.DB)
  const now = nowIso()
  const name = asString(data.name)
  const slug = asString(data.slug)
  const sortOrder = asInteger(data.sort_order, 0)
  const parentId = asNullableString(data.parent_id)
  if (!name || !slug) return badRequest('name and slug are required')
  if (!isValidSlug(slug)) return badRequest('Invalid slug')

  try {
    const duplicate = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(and(eq(schema.categories.slug, slug), ne(schema.categories.id, id)))
      .limit(1)
      .get()
    if (duplicate) return json({ error: 'Slug already exists' }, { status: 409 })

    await db
      .insert(schema.categories)
      .values({
        id,
        parentId,
        name,
        slug,
        sortOrder,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          parentId,
          name,
          slug,
          sortOrder,
          updatedAt: now
        }
      })
    await writeAgentAudit(env, 'upsert', 'categories', id, { slug, source: 'agent_api' })
    return json({ ok: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

async function saveCountry(env: Bindings, id: string, data: Record<string, unknown>): Promise<Response> {
  const db = getDb(env.DB)
  const now = nowIso()
  const iso2 = asString(data.iso2).toLowerCase()
  const nameZh = asString(data.name_zh)
  const nameEn = asString(data.name_en)
  const slug = asString(data.slug)
  const status = normalizeStatus(data.status)
  const publishAt = parseIsoOrNull(data.publish_at)
  const publishedAt = normalizePublishedAt(status, now)
  const faqJson = asJsonString(data.faq_json)

  if (!iso2 || !nameZh || !nameEn || !slug) return badRequest('iso2, name_zh, name_en and slug are required')
  if (!isValidSlug(slug)) return badRequest('Invalid slug')
  if (status === 'scheduled' && !publishAt) return badRequest('publish_at required for scheduled')

  try {
    const duplicateSlug = await db
      .select({ id: schema.countries.id })
      .from(schema.countries)
      .where(and(eq(schema.countries.slug, slug), ne(schema.countries.id, id)))
      .limit(1)
      .get()
    if (duplicateSlug) return json({ error: 'Slug already exists' }, { status: 409 })

    const duplicateIso2 = await db
      .select({ id: schema.countries.id })
      .from(schema.countries)
      .where(and(eq(schema.countries.iso2, iso2), ne(schema.countries.id, id)))
      .limit(1)
      .get()
    if (duplicateIso2) return json({ error: 'ISO2 already exists' }, { status: 409 })

    await db
      .insert(schema.countries)
      .values({
        id,
        iso2,
        name: nameZh || nameEn,
        nameZh,
        nameEn,
        slug,
        heroImageKey: asNullableString(data.hero_image_key),
        seoTitle: asNullableString(data.seo_title_zh) || asNullableString(data.seo_title_en),
        seoTitleZh: asNullableString(data.seo_title_zh),
        seoTitleEn: asNullableString(data.seo_title_en),
        seoDescription: asNullableString(data.seo_description_zh) || asNullableString(data.seo_description_en),
        seoDescriptionZh: asNullableString(data.seo_description_zh),
        seoDescriptionEn: asNullableString(data.seo_description_en),
        contentHtml: asNullableString(data.content_html_zh) || asNullableString(data.content_html_en),
        contentHtmlZh: asNullableString(data.content_html_zh),
        contentHtmlEn: asNullableString(data.content_html_en),
        faqJson,
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
          name: nameZh || nameEn,
          nameZh,
          nameEn,
          slug,
          heroImageKey: asNullableString(data.hero_image_key),
          seoTitle: asNullableString(data.seo_title_zh) || asNullableString(data.seo_title_en),
          seoTitleZh: asNullableString(data.seo_title_zh),
          seoTitleEn: asNullableString(data.seo_title_en),
          seoDescription: asNullableString(data.seo_description_zh) || asNullableString(data.seo_description_en),
          seoDescriptionZh: asNullableString(data.seo_description_zh),
          seoDescriptionEn: asNullableString(data.seo_description_en),
          contentHtml: asNullableString(data.content_html_zh) || asNullableString(data.content_html_en),
          contentHtmlZh: asNullableString(data.content_html_zh),
          contentHtmlEn: asNullableString(data.content_html_en),
          faqJson,
          status,
          publishAt,
          publishedAt: publishedAt ?? sql`${schema.countries.publishedAt}`,
          updatedAt: now
        }
      })
    await writeAgentAudit(env, 'upsert', 'countries', id, { slug, status, source: 'agent_api' })
    return json({ ok: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

async function saveOperator(env: Bindings, id: string, data: Record<string, unknown>): Promise<Response> {
  const db = getDb(env.DB)
  const now = nowIso()
  const nameZh = asString(data.name_zh)
  const nameEn = asString(data.name_en)
  const slug = asString(data.slug)
  const websiteUrl = asString(data.website_url)
  const status = normalizeStatus(data.status)
  const publishAt = parseIsoOrNull(data.publish_at)
  const publishedAt = normalizePublishedAt(status, now)
  const faqJson = asJsonString(data.faq_json)

  if (!nameZh || !nameEn || !slug || !websiteUrl) return badRequest('name_zh, name_en, slug and website_url are required')
  if (!isValidSlug(slug)) return badRequest('Invalid slug')
  if (!isValidUrl(websiteUrl)) return badRequest('Invalid website_url')
  if (status === 'scheduled' && !publishAt) return badRequest('publish_at required for scheduled')

  try {
    const duplicateSlug = await db
      .select({ id: schema.operators.id })
      .from(schema.operators)
      .where(and(eq(schema.operators.slug, slug), ne(schema.operators.id, id)))
      .limit(1)
      .get()
    if (duplicateSlug) return json({ error: 'Slug already exists' }, { status: 409 })

    await db
      .insert(schema.operators)
      .values({
        id,
        name: nameZh || nameEn,
        nameZh,
        nameEn,
        slug,
        websiteUrl,
        logoImageKey: asNullableString(data.logo_image_key),
        supportChannelsJson: asNullableString(data.support_channels_json),
        seoTitle: asNullableString(data.seo_title_zh) || asNullableString(data.seo_title_en),
        seoTitleZh: asNullableString(data.seo_title_zh),
        seoTitleEn: asNullableString(data.seo_title_en),
        seoDescription: asNullableString(data.seo_description_zh) || asNullableString(data.seo_description_en),
        seoDescriptionZh: asNullableString(data.seo_description_zh),
        seoDescriptionEn: asNullableString(data.seo_description_en),
        contentHtml: asNullableString(data.content_html_zh) || asNullableString(data.content_html_en),
        contentHtmlZh: asNullableString(data.content_html_zh),
        contentHtmlEn: asNullableString(data.content_html_en),
        faqJson,
        status,
        publishAt,
        publishedAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.operators.id,
        set: {
          name: nameZh || nameEn,
          nameZh,
          nameEn,
          slug,
          websiteUrl,
          logoImageKey: asNullableString(data.logo_image_key),
          supportChannelsJson: asNullableString(data.support_channels_json),
          seoTitle: asNullableString(data.seo_title_zh) || asNullableString(data.seo_title_en),
          seoTitleZh: asNullableString(data.seo_title_zh),
          seoTitleEn: asNullableString(data.seo_title_en),
          seoDescription: asNullableString(data.seo_description_zh) || asNullableString(data.seo_description_en),
          seoDescriptionZh: asNullableString(data.seo_description_zh),
          seoDescriptionEn: asNullableString(data.seo_description_en),
          contentHtml: asNullableString(data.content_html_zh) || asNullableString(data.content_html_en),
          contentHtmlZh: asNullableString(data.content_html_zh),
          contentHtmlEn: asNullableString(data.content_html_en),
          faqJson,
          status,
          publishAt,
          publishedAt: publishedAt ?? sql`${schema.operators.publishedAt}`,
          updatedAt: now
        }
      })
    await writeAgentAudit(env, 'upsert', 'operators', id, { slug, status, source: 'agent_api' })
    return json({ ok: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

async function saveProduct(env: Bindings, id: string, data: Record<string, unknown>): Promise<Response> {
  const db = getDb(env.DB)
  const now = nowIso()
  const operatorId = asString(data.operator_id)
  const nameZh = asString(data.name_zh)
  const nameEn = asString(data.name_en)
  const slug = asString(data.slug)
  const countryIso2 = asString(data.country_iso2).toLowerCase()
  const purchaseUrl = asString(data.purchase_url)
  const status = normalizeStatus(data.status)
  const publishAt = parseIsoOrNull(data.publish_at)
  const publishedAt = normalizePublishedAt(status, now)
  const days = asInteger(data.days, 0)
  const priceAmount = asNumber(data.price_amount, -1)

  if (!operatorId || !nameZh || !nameEn || !slug || !countryIso2 || !purchaseUrl) {
    return badRequest('operator_id, name_zh, name_en, slug, country_iso2 and purchase_url are required')
  }
  if (!isValidSlug(slug)) return badRequest('Invalid slug')
  if (!isValidUrl(purchaseUrl)) return badRequest('Invalid purchase_url')
  if (days < 1) return badRequest('Invalid days')
  if (priceAmount < 0) return badRequest('Invalid price_amount')
  if (status === 'scheduled' && !publishAt) return badRequest('publish_at required for scheduled')

  try {
    const duplicateSlug = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(and(eq(schema.products.slug, slug), ne(schema.products.id, id)))
      .limit(1)
      .get()
    if (duplicateSlug) return json({ error: 'Slug already exists' }, { status: 409 })

    await db
      .insert(schema.products)
      .values({
        id,
        operatorId,
        categoryId: asNullableString(data.category_id),
        countryIso2,
        name: nameZh || nameEn,
        nameZh,
        nameEn,
        slug,
        dataGb: typeof data.data_gb === 'undefined' || data.data_gb == null || asString(data.data_gb) === '' ? null : asNumber(data.data_gb),
        days,
        isUnlimited: asFlag(data.is_unlimited, false),
        supportsHotspot: asFlag(data.supports_hotspot, true),
        networkType: asNullableString(data.network_type),
        priceAmount,
        priceCurrency: asString(data.price_currency).toUpperCase() || 'USD',
        purchaseUrl,
        coverageRegionsJson: asNullableString(data.coverage_regions_json),
        activationGuideHtml: asNullableString(data.activation_guide_html_zh) || asNullableString(data.activation_guide_html_en) || asNullableString(data.activation_guide_html),
        activationGuideHtmlZh: asNullableString(data.activation_guide_html_zh),
        activationGuideHtmlEn: asNullableString(data.activation_guide_html_en),
        status,
        publishAt,
        publishedAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          operatorId,
          categoryId: asNullableString(data.category_id),
          countryIso2,
          name: nameZh || nameEn,
          nameZh,
          nameEn,
          slug,
          dataGb: typeof data.data_gb === 'undefined' || data.data_gb == null || asString(data.data_gb) === '' ? null : asNumber(data.data_gb),
          days,
          isUnlimited: asFlag(data.is_unlimited, false),
          supportsHotspot: asFlag(data.supports_hotspot, true),
          networkType: asNullableString(data.network_type),
          priceAmount,
          priceCurrency: asString(data.price_currency).toUpperCase() || 'USD',
          purchaseUrl,
          coverageRegionsJson: asNullableString(data.coverage_regions_json),
          activationGuideHtml: asNullableString(data.activation_guide_html_zh) || asNullableString(data.activation_guide_html_en) || asNullableString(data.activation_guide_html),
          activationGuideHtmlZh: asNullableString(data.activation_guide_html_zh),
          activationGuideHtmlEn: asNullableString(data.activation_guide_html_en),
          status,
          publishAt,
          publishedAt: publishedAt ?? sql`${schema.products.publishedAt}`,
          updatedAt: now
        }
      })
    await writeAgentAudit(env, 'upsert', 'products', id, { slug, status, source: 'agent_api' })
    return json({ ok: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

async function savePost(env: Bindings, id: string, data: Record<string, unknown>): Promise<Response> {
  const db = getDb(env.DB)
  const now = nowIso()
  const title = asString(data.title)
  const slug = asString(data.slug)
  const contentHtml = asString(data.content_html)
  const locale = asString(data.locale) || 'zh'
  const status = normalizeStatus(data.status)
  const publishAt = parseIsoOrNull(data.publish_at)
  const publishedAt = normalizePublishedAt(status, now)
  const postType = asString(data.post_type) || 'guide'

  if (!title || !slug || !contentHtml) return badRequest('title, slug and content_html are required')
  if (!isValidSlug(slug)) return badRequest('Invalid slug')
  if (status === 'scheduled' && !publishAt) return badRequest('publish_at required for scheduled')

  try {
    const duplicateSlug = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(and(eq(schema.posts.slug, slug), like(schema.posts.locale, `${locale.toLowerCase()}%`), ne(schema.posts.id, id)))
      .limit(1)
      .get()
    if (duplicateSlug) return json({ error: `Slug already exists for ${locale}` }, { status: 409 })

    await db
      .insert(schema.posts)
      .values({
        id,
        categoryId: asNullableString(data.category_id),
        postType,
        refSlug: asNullableString(data.ref_slug),
        title,
        slug,
        excerpt: asNullableString(data.excerpt),
        contentHtml,
        coverImageKey: asNullableString(data.cover_image_key),
        locale,
        status,
        publishAt,
        publishedAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.posts.id,
        set: {
          categoryId: asNullableString(data.category_id),
          postType,
          refSlug: asNullableString(data.ref_slug),
          title,
          slug,
          excerpt: asNullableString(data.excerpt),
          contentHtml,
          coverImageKey: asNullableString(data.cover_image_key),
          locale,
          status,
          publishAt,
          publishedAt: publishedAt ?? sql`${schema.posts.publishedAt}`,
          updatedAt: now
        }
      })
    await writeAgentAudit(env, 'upsert', 'posts', id, { slug, locale, status, source: 'agent_api' })
    return json({ ok: true, id })
  } catch (error) {
    return handleDbError(error)
  }
}

export async function apiAdminAgentSave(env: Bindings, req: Request, entity: ManagedEntity, idFromPath?: string): Promise<Response> {
  const auth = requireAgentToken(env, req)
  if (auth) return auth
  const data = await parseJsonBody(req)
  if (!data) return badRequest('Invalid JSON')
  const id = idFromPath || asString(data.id) || ulid()

  try {
    if (entity === 'categories') return saveCategory(env, id, data)
    if (entity === 'countries') return saveCountry(env, id, data)
    if (entity === 'operators') return saveOperator(env, id, data)
    if (entity === 'products') return saveProduct(env, id, data)
    return savePost(env, id, data)
  } catch (error) {
    return handleDbError(error)
  }
}
