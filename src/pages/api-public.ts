import type { Bindings } from '../env'
import { and, asc, eq, like, or, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from '../lib/db'
import { json } from '../lib/http'

export async function apiPublicCountry(env: Bindings, slug: string): Promise<Response> {
  const db = getDb(env.DB)
  const row = await db
    .select({
      id: schema.countries.id,
      iso2: schema.countries.iso2,
      name: schema.countries.name,
      slug: schema.countries.slug,
      hero_image_key: schema.countries.heroImageKey,
      seo_title: schema.countries.seoTitle,
      seo_description: schema.countries.seoDescription,
      content_html: schema.countries.contentHtml,
      faq_json: schema.countries.faqJson,
      updated_at: schema.countries.updatedAt
    })
    .from(schema.countries)
    .where(and(eq(schema.countries.slug, slug), eq(schema.countries.status, 'published')))
    .limit(1)
    .get()
  if (!row) return json({ error: 'Not Found' }, { status: 404 })
  return json(row, { headers: { 'Cache-Control': 'public, max-age=120' } })
}

export async function apiPublicOperator(env: Bindings, slug: string): Promise<Response> {
  const db = getDb(env.DB)
  const row = await db
    .select({
      id: schema.operators.id,
      name: schema.operators.name,
      slug: schema.operators.slug,
      website_url: schema.operators.websiteUrl,
      logo_image_key: schema.operators.logoImageKey,
      seo_title: schema.operators.seoTitle,
      seo_description: schema.operators.seoDescription,
      content_html: schema.operators.contentHtml,
      faq_json: schema.operators.faqJson,
      updated_at: schema.operators.updatedAt
    })
    .from(schema.operators)
    .where(and(eq(schema.operators.slug, slug), eq(schema.operators.status, 'published')))
    .limit(1)
    .get()
  if (!row) return json({ error: 'Not Found' }, { status: 404 })
  return json(row, { headers: { 'Cache-Control': 'public, max-age=120' } })
}

export async function apiPublicSearch(env: Bindings, req: Request): Promise<Response> {
  const db = getDb(env.DB)
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const country = (url.searchParams.get('country') ?? '').trim().toLowerCase()
  const limit = clampInt(url.searchParams.get('limit'), 1, 100, 20)
  const offset = clampInt(url.searchParams.get('offset'), 0, 5000, 0)
  const qLike = q ? `%${q}%` : null
  const [countries, operators, products] = await Promise.all([
    qLike
      ? db
          .select({
            name: schema.countries.name,
            slug: schema.countries.slug,
            iso2: schema.countries.iso2
          })
          .from(schema.countries)
          .where(and(
            eq(schema.countries.status, 'published'),
            or(
              like(sql`lower(${schema.countries.name})`, qLike),
              like(sql`lower(${schema.countries.slug})`, qLike),
              like(sql`lower(${schema.countries.iso2})`, qLike)
            )
          ))
          .orderBy(asc(schema.countries.name))
          .limit(12)
      : Promise.resolve([]),
    qLike
      ? db
          .select({
            name: schema.operators.name,
            slug: schema.operators.slug,
            logo_image_key: schema.operators.logoImageKey
          })
          .from(schema.operators)
          .where(and(
            eq(schema.operators.status, 'published'),
            or(
              like(sql`lower(${schema.operators.name})`, qLike),
              like(sql`lower(${schema.operators.slug})`, qLike)
            )
          ))
          .orderBy(sql`${schema.operators.updatedAt} desc`)
          .limit(12)
      : Promise.resolve([]),
    (() => {
      const where = [
        eq(schema.products.status, 'published'),
        eq(schema.operators.status, 'published'),
        eq(schema.countries.status, 'published')
      ]
      if (country) where.push(eq(schema.products.countryIso2, country))
      if (qLike) {
        where.push(or(
          like(sql`lower(${schema.products.name})`, qLike),
          like(sql`lower(${schema.operators.name})`, qLike),
          like(sql`lower(${schema.countries.name})`, qLike),
          like(sql`lower(${schema.countries.slug})`, qLike),
          like(sql`lower(${schema.countries.iso2})`, qLike)
        )!)
      }
      return db
        .select({
          slug: schema.products.slug,
          name: schema.products.name,
          days: schema.products.days,
          data_gb: schema.products.dataGb,
          is_unlimited: schema.products.isUnlimited,
          supports_hotspot: schema.products.supportsHotspot,
          network_type: schema.products.networkType,
          price_amount: schema.products.priceAmount,
          price_currency: schema.products.priceCurrency,
          purchase_url: schema.products.purchaseUrl,
          country_iso2: schema.products.countryIso2,
          operator_name: schema.operators.name,
          operator_slug: schema.operators.slug
        })
        .from(schema.products)
        .innerJoin(schema.operators, eq(schema.operators.id, schema.products.operatorId))
        .innerJoin(schema.countries, eq(schema.countries.iso2, schema.products.countryIso2))
        .where(and(...where))
        .orderBy(asc(schema.products.priceAmount))
        .limit(limit)
        .offset(offset)
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

