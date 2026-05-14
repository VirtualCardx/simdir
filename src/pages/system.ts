import type { Bindings } from '../env'

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
  const [countries, operators, products, posts, categories] = await Promise.all([
    env.DB.prepare("SELECT slug, updated_at FROM countries WHERE status='published' ORDER BY updated_at DESC").all<{ slug: string; updated_at: string }>(),
    env.DB.prepare("SELECT slug, updated_at FROM operators WHERE status='published' ORDER BY updated_at DESC").all<{ slug: string; updated_at: string }>(),
    env.DB.prepare("SELECT slug, updated_at FROM products WHERE status='published' ORDER BY updated_at DESC").all<{ slug: string; updated_at: string }>(),
    env.DB.prepare("SELECT slug, updated_at FROM posts WHERE status='published' ORDER BY updated_at DESC").all<{ slug: string; updated_at: string }>(),
    env.DB.prepare("SELECT DISTINCT c.slug as slug, MAX(p.updated_at) as updated_at FROM categories c JOIN posts p ON p.category_id=c.id AND p.status='published' GROUP BY c.id, c.slug ORDER BY MAX(p.updated_at) DESC").all<{ slug: string; updated_at: string }>()
  ])
  const origin = env.APP_ORIGIN
  const urls: { loc: string; lastmod?: string }[] = []
  urls.push({ loc: new URL('/', origin).toString() })
  urls.push({ loc: new URL('/posts', origin).toString() })
  for (const c of categories.results ?? []) urls.push({ loc: new URL(`/posts/category/${c.slug}`, origin).toString(), lastmod: c.updated_at })
  for (const c of countries.results ?? []) urls.push({ loc: new URL(`/country/${c.slug}`, origin).toString(), lastmod: c.updated_at })
  for (const o of operators.results ?? []) urls.push({ loc: new URL(`/operator/${o.slug}`, origin).toString(), lastmod: o.updated_at })
  for (const p of products.results ?? []) urls.push({ loc: new URL(`/product/${p.slug}`, origin).toString(), lastmod: p.updated_at })
  for (const p of posts.results ?? []) urls.push({ loc: new URL(`/post/${p.slug}`, origin).toString(), lastmod: p.updated_at })
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

