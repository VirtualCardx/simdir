import type { Bindings } from '../env'
import { dbAll, dbGet } from '../lib/db'
import { json } from '../lib/http'

export async function apiPublicCountry(env: Bindings, slug: string): Promise<Response> {
  const row = await dbGet<Record<string, unknown>>(
    env.DB,
    "SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, updated_at FROM countries WHERE slug=? AND status='published'",
    [slug]
  )
  if (!row) return json({ error: 'Not Found' }, { status: 404 })
  return json(row, { headers: { 'Cache-Control': 'public, max-age=120' } })
}

export async function apiPublicOperator(env: Bindings, slug: string): Promise<Response> {
  const row = await dbGet<Record<string, unknown>>(
    env.DB,
    "SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, updated_at FROM operators WHERE slug=? AND status='published'",
    [slug]
  )
  if (!row) return json({ error: 'Not Found' }, { status: 404 })
  return json(row, { headers: { 'Cache-Control': 'public, max-age=120' } })
}

export async function apiPublicSearch(env: Bindings, req: Request): Promise<Response> {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const country = (url.searchParams.get('country') ?? '').trim().toLowerCase()
  const limit = clampInt(url.searchParams.get('limit'), 1, 100, 20)
  const offset = clampInt(url.searchParams.get('offset'), 0, 5000, 0)
  const qLike = q ? `%${q}%` : null
  const [countries, operators, products] = await Promise.all([
    qLike
      ? dbAll<Record<string, unknown>>(
          env.DB,
          "SELECT name, slug, iso2 FROM countries WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ? OR lower(iso2) LIKE ?) ORDER BY name ASC LIMIT 12",
          [qLike, qLike, qLike]
        )
      : Promise.resolve([]),
    qLike
      ? dbAll<Record<string, unknown>>(
          env.DB,
          "SELECT name, slug, logo_image_key FROM operators WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ?) ORDER BY updated_at DESC LIMIT 12",
          [qLike, qLike]
        )
      : Promise.resolve([]),
    (() => {
      const where: string[] = ["p.status='published'", "o.status='published'", "c.status='published'"]
      const params: unknown[] = []
      if (country) {
        where.push('p.country_iso2=?')
        params.push(country)
      }
      if (qLike) {
        where.push('(lower(p.name) LIKE ? OR lower(o.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.slug) LIKE ? OR lower(c.iso2) LIKE ?)')
        params.push(qLike, qLike, qLike, qLike, qLike)
      }
      params.push(limit, offset)
      const sql = `SELECT p.slug, p.name, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, p.country_iso2, o.name as operator_name, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id JOIN countries c ON c.iso2=p.country_iso2 WHERE ${where.join(' AND ')} ORDER BY p.price_amount ASC LIMIT ? OFFSET ?`
      return dbAll<Record<string, unknown>>(env.DB, sql, params)
    })()
  ])
  return json(
    {
      query: { q: q || null, country: country || null, limit, offset },
      countries,
      operators,
      products,
      results: products
    },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}

function clampInt(input: string | null, min: number, max: number, fallback: number): number {
  const n = parseInt(input ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

