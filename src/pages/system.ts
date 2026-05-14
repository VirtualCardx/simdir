import type { Bindings } from '../env'
import { desc, eq, max, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from '../lib/db'

export async function robotsTxt(env: Bindings): Promise<Response> {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${new URL('/sitemap.xml', env.APP_ORIGIN).toString()}\n`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

export async function sitemapXml(env: Bindings): Promise<Response> {
  const db = getDb(env.DB)
  const [countries, operators, products, posts, categories] = await Promise.all([
    db
      .select({ slug: schema.countries.slug, updated_at: schema.countries.updatedAt })
      .from(schema.countries)
      .where(eq(schema.countries.status, 'published'))
      .orderBy(desc(schema.countries.updatedAt)),
    db
      .select({ slug: schema.operators.slug, updated_at: schema.operators.updatedAt })
      .from(schema.operators)
      .where(eq(schema.operators.status, 'published'))
      .orderBy(desc(schema.operators.updatedAt)),
    db
      .select({ slug: schema.products.slug, updated_at: schema.products.updatedAt })
      .from(schema.products)
      .where(eq(schema.products.status, 'published'))
      .orderBy(desc(schema.products.updatedAt)),
    db
      .select({ slug: schema.posts.slug, updated_at: max(schema.posts.updatedAt).as('updated_at') })
      .from(schema.posts)
      .where(eq(schema.posts.status, 'published'))
      .groupBy(schema.posts.slug)
      .orderBy(desc(max(schema.posts.updatedAt))),
    db
      .select({
        slug: schema.categories.slug,
        updated_at: max(schema.posts.updatedAt).as('updated_at')
      })
      .from(schema.categories)
      .innerJoin(schema.posts, sql`${schema.posts.categoryId} = ${schema.categories.id} and ${schema.posts.status} = 'published'`)
      .groupBy(schema.categories.id, schema.categories.slug)
      .orderBy(desc(max(schema.posts.updatedAt)))
  ])
  const origin = env.APP_ORIGIN
  const urls: { loc: string; lastmod?: string }[] = []
  urls.push({ loc: new URL('/', origin).toString() })
  urls.push({ loc: new URL('/posts', origin).toString() })
  for (const c of categories) urls.push({ loc: new URL(`/posts/category/${c.slug}`, origin).toString(), lastmod: c.updated_at ?? undefined })
  for (const c of countries) urls.push({ loc: new URL(`/country/${c.slug}`, origin).toString(), lastmod: c.updated_at })
  for (const o of operators) urls.push({ loc: new URL(`/operator/${o.slug}`, origin).toString(), lastmod: o.updated_at })
  for (const p of products) urls.push({ loc: new URL(`/product/${p.slug}`, origin).toString(), lastmod: p.updated_at })
  for (const p of posts) urls.push({ loc: new URL(`/post/${p.slug}`, origin).toString(), lastmod: p.updated_at ?? undefined })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''
    return `<url><loc>${escapeXml(u.loc)}</loc>${lastmod}</url>`
  })
  .join('')}
</urlset>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800'
    }
  })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

