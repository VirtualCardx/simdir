import type { Bindings } from '../env'
import { and, asc as orderAsc, desc as orderDesc, eq, like, ne, or, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from '../lib/db'
import { html } from '../lib/http'
import { autoDescription, escapeHtml } from '../lib/seo'
import { criticalCss, layout } from '../lib/templates'
import { mediaUrl } from '../lib/media'
import { languageSwitchHref, localeLabel, normalizeLocale, pick, resolveLocale, type SiteLocale } from '../lib/i18n'
import { getSiteSettings, resolveSiteFaviconUrl, resolveSiteKeywords, resolveSiteLogoUrl, resolveSiteTagline, resolveSiteTitle, type SiteSettings } from '../lib/site-settings'

type Country = { name: string; name_zh: string | null; name_en: string | null; slug: string; iso2: string; seo_title: string | null; seo_title_zh: string | null; seo_title_en: string | null; seo_description: string | null; seo_description_zh: string | null; seo_description_en: string | null; content_html: string | null; content_html_zh: string | null; content_html_en: string | null; hero_image_key: string | null; faq_json: string | null }
type Operator = { name: string; name_zh: string | null; name_en: string | null; slug: string; website_url: string; seo_title: string | null; seo_title_zh: string | null; seo_title_en: string | null; seo_description: string | null; seo_description_zh: string | null; seo_description_en: string | null; content_html: string | null; content_html_zh: string | null; content_html_en: string | null; logo_image_key: string | null; faq_json: string | null }
type Product = { name: string; name_zh: string | null; name_en: string | null; slug: string; days: number; data_gb: number | null; is_unlimited: number; supports_hotspot: number; network_type: string | null; price_amount: number; price_currency: string; purchase_url: string; activation_guide_html?: string | null; activation_guide_html_zh?: string | null; activation_guide_html_en?: string | null; operator_name: string; operator_name_zh?: string | null; operator_name_en?: string | null; operator_slug: string }
type Post = {
  title: string
  slug: string
  excerpt: string | null
  content_html: string
  cover_image_key: string | null
  locale: string
  post_type: string
  category_name: string | null
  category_name_zh: string | null
  category_name_en: string | null
  category_slug: string | null
  published_at: string | null
  updated_at: string
}
type SearchCountry = { name: string; name_zh: string | null; name_en: string | null; slug: string; iso2: string }
type SearchOperator = { name: string; name_zh: string | null; name_en: string | null; slug: string; logo_image_key: string | null }
type CategorySummary = { name: string; name_zh: string | null; name_en: string | null; slug: string; post_count: number }

const postListSelection = {
  title: schema.posts.title,
  slug: schema.posts.slug,
  excerpt: schema.posts.excerpt,
  content_html: schema.posts.contentHtml,
  cover_image_key: schema.posts.coverImageKey,
  locale: schema.posts.locale,
  post_type: schema.posts.postType,
  category_name: schema.categories.name,
  category_name_zh: schema.categories.nameZh,
  category_name_en: schema.categories.nameEn,
  category_slug: schema.categories.slug,
  published_at: schema.posts.publishedAt,
  updated_at: schema.posts.updatedAt
}

function localizedText(locale: SiteLocale, zh: string | null | undefined, en: string | null | undefined, fallback: string): string {
  const primary = locale === 'zh' ? zh : en
  const secondary = locale === 'zh' ? en : zh
  return (primary ?? '').trim() || (secondary ?? '').trim() || fallback
}

function formatDate(iso: string | null | undefined, locale: SiteLocale): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return locale === 'zh'
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function postsUrl(category: string, lang: string): string {
  const qs = new URLSearchParams()
  if (category) qs.set('category', category)
  if (lang) qs.set('lang', lang)
  const query = qs.toString()
  return query ? `/posts?${query}` : '/posts'
}

function publicHeader(env: Bindings, req: Request, locale: SiteLocale, site: SiteSettings, links: Array<{ href: string; label: string }>): string {
  const current = new URL(req.url)
  const currentPath = `${current.pathname}${current.search}`
  const logoUrl = resolveSiteLogoUrl(env, site)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const tagline = resolveSiteTagline(site, locale, pick(locale, '全球旅行上网指南', 'Global travel connectivity guide'))
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/" aria-label="Home">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteTitle)} logo" width="46" height="46" style="width:46px;height:46px;border-radius:14px;border:1px solid var(--b);object-fit:cover;background:#fff">` : '<span class="brand-badge">eSIM</span>'}
        <span class="brand-copy">
          <strong>${escapeHtml(siteTitle)}</strong>
          <small>${escapeHtml(tagline)}</small>
        </span>
      </a>
      <div class="nav-links">
        ${links.map((link) => `<a class="nav-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === 'zh' ? 'primary' : ''}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref('zh', currentPath))}">中文</a>
        <a class="btn ${locale === 'en' ? 'primary' : ''}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref('en', currentPath))}">EN</a>
        <a class="btn primary" href="/admin/login">${escapeHtml(pick(locale, '管理后台', 'Admin'))}</a>
      </div>
    </nav>
  </header>`
}

type OperatorListItem = { name: string; name_zh: string | null; name_en: string | null; slug: string; logo_image_key: string | null }

export async function operatorsIndexPage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const db = getDb(env.DB)

  const where = [eq(schema.operators.status, 'published')]
  if (q) {
    const qLike = `%${q.toLowerCase()}%`
    where.push(or(
      like(sql`lower(${schema.operators.name})`, qLike),
      like(sql`lower(coalesce(${schema.operators.nameZh}, ''))`, qLike),
      like(sql`lower(coalesce(${schema.operators.nameEn}, ''))`, qLike),
      like(sql`lower(${schema.operators.slug})`, qLike)
    )!)
  }
  const operators = await db
    .select({
      name: schema.operators.name,
      name_zh: schema.operators.nameZh,
      name_en: schema.operators.nameEn,
      slug: schema.operators.slug,
      logo_image_key: schema.operators.logoImageKey
    })
    .from(schema.operators)
    .where(and(...where))
    .orderBy(orderDesc(schema.operators.updatedAt))
    .limit(200) as OperatorListItem[]

  const canonical = new URL('/operators', env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main class="section-gap">
    <section class="page-header">
      <h1>${escapeHtml(pick(locale, 'eSIM 服务商', 'eSIM Providers'))}</h1>
      <p>${escapeHtml(pick(locale, '浏览所有已发布的 eSIM 服务商，点击查看详情及套餐。', 'Browse all published eSIM providers. Click to view details and plans.'))}</p>
    </section>
    <section class="card muted-panel">
      <form method="GET" action="/operators" aria-label="Search operators">
        <label>
          <span><small>${escapeHtml(pick(locale, '搜索服务商', 'Search providers'))}</small></span>
          <input class="input" name="q" value="${escapeHtml(q)}" placeholder="${escapeHtml(pick(locale, '输入服务商名称', 'Type provider name'))}" />
        </label>
        <div style="height:8px"></div>
        <div class="action-row">
          <button class="btn primary" type="submit">${escapeHtml(pick(locale, '搜索', 'Search'))}</button>
          ${q ? `<a class="btn" href="/operators">${escapeHtml(pick(locale, '清除搜索', 'Clear search'))}</a>` : ''}
        </div>
      </form>
    </section>
    <section class="card">
      ${operators.length === 0
        ? `<p>${escapeHtml(pick(locale, '没有找到匹配的服务商。', 'No matching providers found.'))}</p>`
        : `<div class="card-grid">${operators
            .map((o) => {
              const operatorName = localizedText(locale, o.name_zh, o.name_en, o.name)
              const logo = o.logo_image_key ? `<img src="${escapeHtml(mediaUrl(env.APP_ORIGIN, o.logo_image_key))}" alt="${escapeHtml(operatorName)} logo" width="48" height="48" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover" />` : ''
              return `<a class="card card-link" href="/operator/${escapeHtml(o.slug)}">${logo}<div><strong>${escapeHtml(operatorName)}</strong><div><small>${escapeHtml(pick(locale, '查看详情', 'View details'))}</small></div></div></a>`
            })
            .join('')}</div>`
      }
    </section>
  </main>
  `
  return html(
    layout(
      {
        title: pick(locale, `eSIM 服务商 | ${siteTitle}`, `eSIM Providers | ${siteTitle}`),
        description: pick(locale, '浏览所有已发布的 eSIM 服务商。', 'Browse all published eSIM providers.'),
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        robots: 'index, follow'
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  )
}

export async function homePage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const [countries, operators, postCategories] = await Promise.all([
    db
      .select({
        name: schema.countries.name,
        name_zh: schema.countries.nameZh,
        name_en: schema.countries.nameEn,
        slug: schema.countries.slug
      })
      .from(schema.countries)
      .where(eq(schema.countries.status, 'published'))
      .orderBy(sql`coalesce(${schema.countries.nameEn}, ${schema.countries.nameZh}, ${schema.countries.name}) asc`)
      .limit(60),
    db
      .select({
        name: schema.operators.name,
        name_zh: schema.operators.nameZh,
        name_en: schema.operators.nameEn,
        slug: schema.operators.slug,
        logo_image_key: schema.operators.logoImageKey
      })
      .from(schema.operators)
      .where(eq(schema.operators.status, 'published'))
      .orderBy(orderDesc(schema.operators.updatedAt))
      .limit(12),
    db
      .select({
        name: schema.categories.name,
        name_zh: schema.categories.nameZh,
        name_en: schema.categories.nameEn,
        slug: schema.categories.slug,
        post_count: sql<number>`count(distinct coalesce(nullif(${schema.posts.refSlug}, ''), ${schema.posts.slug}))`
      })
      .from(schema.categories)
      .leftJoin(schema.posts, and(eq(schema.posts.categoryId, schema.categories.id), eq(schema.posts.status, 'published')))
      .groupBy(schema.categories.id, schema.categories.name, schema.categories.slug, schema.categories.sortOrder)
      .orderBy(orderDesc(sql`count(distinct coalesce(nullif(${schema.posts.refSlug}, ''), ${schema.posts.slug}))`), orderAsc(schema.categories.sortOrder), orderAsc(schema.categories.name))
      .limit(8) as Promise<CategorySummary[]>
  ])
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="hero" aria-label="Hero">
      <div class="card">
        <span class="eyebrow">${escapeHtml(pick(locale, '全球 eSIM 目录', 'Global eSIM Directory'))}</span>
        <h1>${escapeHtml(pick(locale, '按国家查找并对比 eSIM 套餐', 'Find and compare eSIM plans by country'))}</h1>
        <p>${escapeHtml(pick(locale, '面向全球用户的 eSIM 目录，聚合国家页、供应商页与套餐详情，支持 SEO 落地、快速筛选与购买跳转。', 'A global eSIM directory with country pages, operator profiles, and product details for fast search and conversion.'))}</p>
        <div class="hero-stats">
          <div class="stat"><small>${escapeHtml(pick(locale, '国家入口', 'Countries'))}</small><strong>${countries.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, '已发布供应商', 'Published operators'))}</small><strong>${operators.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, '使用场景', 'Use cases'))}</small><strong>${escapeHtml(pick(locale, '旅行 / 商务 / 长住', 'Travel / Business / Living'))}</strong></div>
        </div>
      </div>
      <div class="card muted-panel">
        <h2>${escapeHtml(pick(locale, '快速搜索', 'Quick Search'))}</h2>
        <form method="GET" action="/search" aria-label="Search">
          <label>
            <span><small>${escapeHtml(pick(locale, '关键词（国家/供应商）', 'Keyword (country / operator)'))}</small></span>
            <input class="input" name="q" placeholder="${escapeHtml(pick(locale, '日本 / Airalo', 'Japan / Airalo'))}" />
          </label>
          <div style="height:8px"></div>
          <div class="action-row">
            <button class="btn primary" type="submit">${escapeHtml(pick(locale, '搜索', 'Search'))}</button>
            <a class="btn" href="/posts">${escapeHtml(pick(locale, '浏览资讯', 'Browse news'))}</a>
          </div>
        </form>
      </div>
    </section>
    <div class="section-gap">
      <section class="split-grid" aria-label="Directory">
        <div class="card">
          <h2>${escapeHtml(pick(locale, '热门国家', 'Popular countries'))}</h2>
          <p>${escapeHtml(pick(locale, '从国家入口快速进入对应的套餐与运营商列表页。', 'Jump from country hubs to available operators and plans.'))}</p>
          <div class="chip-row">
            ${countries
              .map((c) => `<a class="btn" href="/country/${escapeHtml(c.slug)}">${escapeHtml(localizedText(locale, c.name_zh, c.name_en, c.name))}</a>`)
              .join('')}
          </div>
        </div>
        <section class="card muted-panel" aria-label="Operators">
        <h2>${escapeHtml(pick(locale, '最新供应商', 'Latest operators'))}</h2>
        <p>${escapeHtml(pick(locale, '首页仅展示已发布的供应商。', 'The homepage only shows published operators.'))}</p>
        <div class="card-grid">
          ${operators
            .map((o) => {
              const operatorName = localizedText(locale, o.name_zh, o.name_en, o.name)
              const logo = o.logo_image_key ? `<img src="${escapeHtml(mediaUrl(env.APP_ORIGIN, o.logo_image_key))}" alt="${escapeHtml(operatorName)} logo" width="48" height="48" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover" />` : ''
              return `<a class="card card-link" href="/operator/${escapeHtml(o.slug)}">
                ${logo}
                <div>
                  <strong>${escapeHtml(operatorName)}</strong>
                  <div><small>${escapeHtml(pick(locale, '查看供应商详情', 'View operator details'))}</small></div>
                </div>
              </a>`
            })
            .join('')}
        </div>
        </section>
      </section>
      <section class="card">
        <h2>${escapeHtml(pick(locale, '热门资讯类型', 'Popular news categories'))}</h2>
        <p>${escapeHtml(pick(locale, '按资讯类型快速进入已发布文章聚合页。', 'Jump into published article collections by topic.'))}</p>
        <div class="card-grid">
          ${postCategories
            .map((c) => `<a class="card card-link" href="/posts/category/${escapeHtml(c.slug)}"><div><strong>${escapeHtml(localizedText(locale, c.name_zh, c.name_en, c.name))}</strong><div><small>${escapeHtml(String(c.post_count))} ${escapeHtml(pick(locale, '篇文章', 'articles'))}</small></div></div></a>`)
            .join('')}
        </div>
      </section>
    </div>
  </main>
  <footer>
    <small>${escapeHtml(pick(locale, '免责声明：价格与覆盖范围可能变化，本站不直接销售 eSIM。', 'Disclaimer: prices and coverage may change. This site does not sell eSIMs directly.'))}</small>
  </footer>
  `
  const canonical = new URL('/', env.APP_ORIGIN).toString()
  const meta = {
    title: pick(locale, `全球 eSIM 目录：按国家查找与对比 | ${siteTitle}`, `Global eSIM Directory | ${siteTitle}`),
    description: pick(locale, '浏览各国家/地区 eSIM 供应商与套餐，支持筛选与跳转购买。', 'Browse eSIM operators and plans by country with fast filtering and outbound purchase links.'),
    canonical,
    keywords: resolveSiteKeywords(site, locale) || undefined,
    faviconHref,
    locale: locale === 'zh' ? 'zh-CN' : 'en',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteTitle,
        url: canonical
      }
    ]
  }
  return html(layout(meta, body, criticalCss()), {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
    }
  })
}

export async function postsIndexPage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const url = new URL(req.url)
  const category = (url.searchParams.get('category') ?? '').trim()
  const lang = locale
  const db = getDb(env.DB)
  const where = [eq(schema.posts.status, 'published')]
  if (category) where.push(eq(schema.categories.slug, category))
  if (lang) where.push(like(schema.posts.locale, `${lang}%`))
  const [posts, categories] = await Promise.all([
    db
      .select(postListSelection)
      .from(schema.posts)
      .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
      .where(and(...where))
      .orderBy(orderDesc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`))
      .limit(200) as Promise<Post[]>,
    db
      .select({ name: schema.categories.name, name_zh: schema.categories.nameZh, name_en: schema.categories.nameEn, slug: schema.categories.slug })
      .from(schema.categories)
      .orderBy(orderAsc(schema.categories.sortOrder), orderAsc(schema.categories.name))
      .limit(100)
  ])
  const canonical = new URL(postsUrl(category, lang), env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main class="section-gap posts-page">
    <section class="card muted-panel posts-section">
      <h2>${escapeHtml(pick(locale, '文章类型', 'Article Types'))}</h2>
      <div class="chip-row">
        <a class="btn ${!category ? 'primary' : ''}" href="${postsUrl('', lang)}">${escapeHtml(pick(locale, '全部资讯', 'All Articles'))}</a>
        ${categories.map((c) => `<a class="btn ${category === c.slug ? 'primary' : ''}" href="${postsUrl(c.slug, lang)}">${escapeHtml(localizedText(locale, c.name_zh, c.name_en, c.name))}</a>`).join('')}
      </div>
    </section>
    <section class="card posts-section">
      <h1 class="posts-heading">${escapeHtml(pick(locale, '已发布 SIM卡资讯', 'Published SIM Card News'))}</h1>
      <p class="posts-intro">${escapeHtml(pick(locale, '当前列表仅展示系统中已发布的文章，并跟随全站语言显示。', 'This list only shows published articles and follows the current site language.'))}</p>
      <ul class="posts-list">
        ${posts
          .map((p) => {
            const date = p.published_at ?? p.updated_at
            return `<li class="posts-item">
              <a href="/post/${escapeHtml(p.slug)}"><strong>${escapeHtml(p.title)}</strong></a>
              <div class="posts-meta">
                <small>${escapeHtml(formatDate(date, locale))}</small>
                <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
                ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, lang)}">${escapeHtml(localizedText(locale, p.category_name_zh, p.category_name_en, p.category_name))}</a>` : ''}
              </div>
              ${p.excerpt ? `<div class="posts-excerpt"><small>${escapeHtml(p.excerpt)}</small></div>` : ''}
            </li>`
          })
          .join('')}
      </ul>
    </section>
  </main>
  `
  return html(
    layout(
      {
        title: pick(locale, `SIM卡资讯 | ${siteTitle}`, `SIM Card News | ${siteTitle}`),
        description: pick(locale, '浏览系统中已发布的 SIM 卡资讯文章。', 'Browse published SIM card news and guides in the system.'),
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: pick(locale, 'SIM卡资讯', 'SIM Card News'),
            url: canonical
          }
        ]
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}

export async function postCategoryPage(env: Bindings, req: Request, slug: string): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const lang = locale
  const db = getDb(env.DB)
  const category = await db
    .select({ id: schema.categories.id, name: schema.categories.name, name_zh: schema.categories.nameZh, name_en: schema.categories.nameEn, slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, slug))
    .limit(1)
    .get()
  if (!category) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const postWhere = [eq(schema.posts.status, 'published'), eq(schema.posts.categoryId, category.id)]
  if (lang) postWhere.push(like(schema.posts.locale, `${lang}%`))
  const posts = await db
    .select(postListSelection)
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
    .where(and(...postWhere))
    .orderBy(orderDesc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`))
    .limit(200) as Post[]
  const categoryUrl = `/posts/category/${category.slug}`
  const canonical = new URL(categoryUrl, env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / <a href="/posts">${escapeHtml(pick(locale, 'SIM卡资讯', 'SIM Card News'))}</a> / ${escapeHtml(localizedText(locale, category.name_zh, category.name_en, category.name))}</small></nav>
      <div>
        <span class="eyebrow">${escapeHtml(pick(locale, '分类页', 'Category'))}</span>
        <h1>${escapeHtml(localizedText(locale, category.name_zh, category.name_en, category.name))}</h1>
        <p>${escapeHtml(pick(locale, '浏览', 'Browse'))} ${escapeHtml(localizedText(locale, category.name_zh, category.name_en, category.name))} ${escapeHtml(pick(locale, '分类下已发布的文章内容，并跟随全站语言显示。', 'published articles in this category, following the current site language.'))}</p>
      </div>
    </section>
    <section class="card">
      <div class="action-row">
        <a class="btn" href="/posts">${escapeHtml(pick(locale, '返回全部文章', 'Back to all articles'))}</a>
      </div>
      <div style="height:12px"></div>
      <ul>
        ${posts
          .map((p) => {
            const date = p.published_at ?? p.updated_at
            return `<li style="margin:10px 0">
              <a href="/post/${escapeHtml(p.slug)}"><strong>${escapeHtml(p.title)}</strong></a>
              <div><small>${escapeHtml(formatDate(date, locale))}</small></div>
              <div><small>${escapeHtml(localeLabel(p.locale))}</small></div>
              ${p.excerpt ? `<div><small>${escapeHtml(p.excerpt)}</small></div>` : ''}
            </li>`
          })
          .join('')}
      </ul>
    </section>
  </main>
  `
  const categoryName = localizedText(locale, category.name_zh, category.name_en, category.name)
  return html(
    layout(
      {
        title: `${categoryName} | ${siteTitle}`,
        description: pick(locale, `${categoryName} 分类下的 SIM卡资讯文章。`, `SIM card news articles under ${categoryName}.`),
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: categoryName,
            url: canonical
          }
        ]
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}

export async function postPage(env: Bindings, req: Request, slug: string): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const p = await db
    .select(postListSelection)
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
    .where(and(eq(schema.posts.slug, slug), eq(schema.posts.status, 'published')))
    .orderBy(sql`case when lower(${schema.posts.locale}) like ${`${locale}%`} then 0 else 1 end`, orderDesc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`))
    .limit(1)
    .get() as Post | undefined
  if (!p) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const canonical = new URL(`/post/${p.slug}`, env.APP_ORIGIN).toString()
  const ogImage = p.cover_image_key ? mediaUrl(env.APP_ORIGIN, p.cover_image_key) : undefined
  const desc = p.excerpt ?? autoDescription(p.content_html)
  const published = p.published_at ?? p.updated_at
  const related = p.category_slug
    ? await db
        .select({ title: schema.posts.title, slug: schema.posts.slug })
        .from(schema.posts)
        .leftJoin(schema.categories, eq(schema.categories.id, schema.posts.categoryId))
        .where(and(eq(schema.posts.status, 'published'), eq(schema.categories.slug, p.category_slug), ne(schema.posts.slug, p.slug), like(schema.posts.locale, `${normalizeLocale(p.locale) || 'en'}%`)))
        .orderBy(orderDesc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`))
        .limit(4)
    : []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    datePublished: published,
    dateModified: p.updated_at,
    mainEntityOfPage: canonical,
    image: ogImage ? [ogImage] : undefined
  }
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / <a href="/posts">${escapeHtml(pick(locale, 'SIM卡资讯', 'SIM Card News'))}</a>${p.category_name && p.category_slug ? ` / <a href="/posts?category=${encodeURIComponent(p.category_slug)}">${escapeHtml(localizedText(locale, p.category_name_zh, p.category_name_en, p.category_name))}</a>` : ''} / ${escapeHtml(p.title)}</small></nav>
      <div>
        <h1>${escapeHtml(p.title)}</h1>
        <small>${escapeHtml(formatDate(published, locale))}</small>
        <div class="chip-row" style="margin-top:8px">
          <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
          ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, normalizeLocale(p.locale))}">${escapeHtml(localizedText(locale, p.category_name_zh, p.category_name_en, p.category_name))}</a>` : ''}
        </div>
      </div>
    </section>
    ${ogImage ? `<div style="height:12px"></div><img src="${escapeHtml(ogImage)}" alt="${escapeHtml(p.title)}" loading="lazy" style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;border:1px solid var(--b)" />` : ''}
    <div style="height:12px"></div>
    <section class="card content-prose" aria-label="Post">${p.content_html}</section>
    ${related.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, '同分类推荐', 'More in this category'))}</h2><div class="card-grid">${related
      .map((item) => `<a class="card card-link" href="/post/${escapeHtml(item.slug)}"><div><strong>${escapeHtml(item.title)}</strong><div><small>${escapeHtml(pick(locale, '继续阅读', 'Continue reading'))}</small></div></div></a>`)
      .join('')}</div></section>` : ''}
  </main>
  `
  return html(
    layout(
      {
        title: `${p.title} | ${siteTitle}`,
        description: desc,
        canonical,
        ogImage,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: normalizeLocale(p.locale) === 'zh' ? 'zh-CN' : 'en',
        jsonLd: [jsonLd]
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=600' } }
  )
}

export async function searchPage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const country = (url.searchParams.get('country') ?? '').trim().toLowerCase()
  const qLike = q ? `%${q.toLowerCase()}%` : null
  const [countries, operators, products] = await Promise.all([
    qLike
      ? db
          .select({
            name: schema.countries.name,
            name_zh: schema.countries.nameZh,
            name_en: schema.countries.nameEn,
            slug: schema.countries.slug,
            iso2: schema.countries.iso2
          })
          .from(schema.countries)
          .where(and(
            eq(schema.countries.status, 'published'),
            or(
              like(sql`lower(${schema.countries.name})`, qLike),
              like(sql`lower(coalesce(${schema.countries.nameZh}, ''))`, qLike),
              like(sql`lower(coalesce(${schema.countries.nameEn}, ''))`, qLike),
              like(sql`lower(${schema.countries.slug})`, qLike),
              like(sql`lower(${schema.countries.iso2})`, qLike)
            )!
          ))
          .orderBy(sql`coalesce(${schema.countries.nameEn}, ${schema.countries.nameZh}, ${schema.countries.name}) asc`)
          .limit(12) as Promise<SearchCountry[]>
      : Promise.resolve([]),
    qLike
      ? db
          .select({
            name: schema.operators.name,
            name_zh: schema.operators.nameZh,
            name_en: schema.operators.nameEn,
            slug: schema.operators.slug,
            logo_image_key: schema.operators.logoImageKey
          })
          .from(schema.operators)
          .where(and(
            eq(schema.operators.status, 'published'),
            or(
              like(sql`lower(${schema.operators.name})`, qLike),
              like(sql`lower(coalesce(${schema.operators.nameZh}, ''))`, qLike),
              like(sql`lower(coalesce(${schema.operators.nameEn}, ''))`, qLike),
              like(sql`lower(${schema.operators.slug})`, qLike)
            )!
          ))
          .orderBy(orderDesc(schema.operators.updatedAt))
          .limit(12) as Promise<SearchOperator[]>
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
          like(sql`lower(coalesce(${schema.products.nameZh}, ''))`, qLike),
          like(sql`lower(coalesce(${schema.products.nameEn}, ''))`, qLike),
          like(sql`lower(${schema.operators.name})`, qLike),
          like(sql`lower(coalesce(${schema.operators.nameZh}, ''))`, qLike),
          like(sql`lower(coalesce(${schema.operators.nameEn}, ''))`, qLike),
          like(sql`lower(${schema.countries.name})`, qLike),
          like(sql`lower(coalesce(${schema.countries.nameZh}, ''))`, qLike),
          like(sql`lower(coalesce(${schema.countries.nameEn}, ''))`, qLike),
          like(sql`lower(${schema.countries.slug})`, qLike),
          like(sql`lower(${schema.countries.iso2})`, qLike)
        )!)
      }
      return db
        .select({
          name: schema.products.name,
          name_zh: schema.products.nameZh,
          name_en: schema.products.nameEn,
          slug: schema.products.slug,
          days: schema.products.days,
          data_gb: schema.products.dataGb,
          is_unlimited: schema.products.isUnlimited,
          supports_hotspot: schema.products.supportsHotspot,
          network_type: schema.products.networkType,
          price_amount: schema.products.priceAmount,
          price_currency: schema.products.priceCurrency,
          purchase_url: schema.products.purchaseUrl,
          operator_name: schema.operators.name,
          operator_name_zh: schema.operators.nameZh,
          operator_name_en: schema.operators.nameEn,
          operator_slug: schema.operators.slug
        })
        .from(schema.products)
        .innerJoin(schema.operators, eq(schema.operators.id, schema.products.operatorId))
        .innerJoin(schema.countries, eq(schema.countries.iso2, schema.products.countryIso2))
        .where(and(...where))
        .orderBy(orderAsc(schema.products.priceAmount))
        .limit(100) as Promise<Product[]>
    })()
  ])
  const canonical = new URL(`/search?${url.searchParams.toString()}`, env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="page-header">
      <span class="eyebrow">${escapeHtml(pick(locale, '搜索', 'Search'))}</span>
      <div>
        <h1>${escapeHtml(pick(locale, '搜索结果', 'Search Results'))}</h1>
        <p>${escapeHtml(pick(locale, '关键词：', 'Keyword:'))}<strong>${escapeHtml(q || '—')}</strong>${escapeHtml(pick(locale, '，命中国家 ', ', matched '))}${countries.length}${escapeHtml(pick(locale, ' 项、供应商 ', ' countries, '))}${operators.length}${escapeHtml(pick(locale, ' 项、套餐 ', ' operators, and '))}${products.length}${escapeHtml(pick(locale, ' 项套餐。', ' plans.'))}</p>
      </div>
    </section>
    ${!q && !country ? `<section class="card muted-panel"><p>${escapeHtml(pick(locale, '请输入国家、运营商或套餐关键词，例如 ', 'Enter a country, operator, or plan keyword such as '))}<strong>Japan</strong> / <strong>Airalo</strong>.</p></section>` : ''}
    ${countries.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, '国家结果', 'Country results'))}</h2><div class="card-grid">${countries
      .map((c) => `<a class="card card-link" href="/country/${escapeHtml(c.slug)}"><div><strong>${escapeHtml(localizedText(locale, c.name_zh, c.name_en, c.name))}</strong><div><small>${escapeHtml(c.iso2.toUpperCase())}</small></div></div></a>`)
      .join('')}</div></section>` : ''}
    ${operators.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, '供应商结果', 'Operator results'))}</h2><div class="card-grid">${operators
      .map((o) => {
        const operatorName = localizedText(locale, o.name_zh, o.name_en, o.name)
        const logo = o.logo_image_key ? `<img src="${escapeHtml(mediaUrl(env.APP_ORIGIN, o.logo_image_key))}" alt="${escapeHtml(operatorName)} logo" width="48" height="48" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover" />` : ''
        return `<a class="card card-link" href="/operator/${escapeHtml(o.slug)}">${logo}<div><strong>${escapeHtml(operatorName)}</strong><div><small>${escapeHtml(pick(locale, '查看供应商详情', 'View operator details'))}</small></div></div></a>`
      })
      .join('')}</div></section>` : ''}
    <section class="card">
      <h2>${escapeHtml(pick(locale, '套餐结果', 'Plan results'))}</h2>
      <div class="table-wrap">
      <table>
          ${products.length > 0 ? products
            .map((p) => {
              const data = p.is_unlimited ? '无限' : p.data_gb ? `${p.data_gb}GB` : '—'
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const operatorName = localizedText(locale, p.operator_name_zh, p.operator_name_en, p.operator_name)
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tbody class="hover-group"><tr><td colspan="5" style="border-bottom:none;padding-bottom:4px"><strong><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(productName)}</a></strong></td></tr>
              <tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(operatorName)}</a></td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">去购买</a></td>
              </tr></tbody>`
            })
            .join('') : '<tbody><tr><td colspan="5"><small>暂无匹配套餐，请尝试国家名、供应商名或更短的关键词。</small></td></tr></tbody>'}
      </table>
      </div>
    </section>
  </main>
  `
  return html(
    layout(
      {
        title: `搜索 eSIM 套餐 | ${siteTitle}`,
        description: q ? `搜索 ${q} 的 eSIM 套餐与供应商。` : '搜索 eSIM 套餐与供应商。',
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } }
  )
}

export async function productPage(env: Bindings, req: Request, slug: string): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const p = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      name_zh: schema.products.nameZh,
      name_en: schema.products.nameEn,
      slug: schema.products.slug,
      days: schema.products.days,
      data_gb: schema.products.dataGb,
      is_unlimited: schema.products.isUnlimited,
      supports_hotspot: schema.products.supportsHotspot,
      network_type: schema.products.networkType,
      price_amount: schema.products.priceAmount,
      price_currency: schema.products.priceCurrency,
      purchase_url: schema.products.purchaseUrl,
      coverage_regions_json: schema.products.coverageRegionsJson,
      activation_guide_html: schema.products.activationGuideHtml,
      activation_guide_html_zh: schema.products.activationGuideHtmlZh,
      activation_guide_html_en: schema.products.activationGuideHtmlEn,
      country_iso2: schema.products.countryIso2,
      operator_name: schema.operators.name,
      operator_name_zh: schema.operators.nameZh,
      operator_name_en: schema.operators.nameEn,
      operator_slug: schema.operators.slug,
      operator_website: schema.operators.websiteUrl,
      status: schema.products.status,
      updated_at: schema.products.updatedAt
    })
    .from(schema.products)
    .innerJoin(schema.operators, eq(schema.operators.id, schema.products.operatorId))
    .where(and(eq(schema.products.slug, slug), eq(schema.products.status, 'published'), eq(schema.operators.status, 'published')))
    .limit(1)
    .get()
  if (!p) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const canonical = new URL(`/product/${String(p.slug)}`, env.APP_ORIGIN).toString()
  const productName = localizedText(locale, String(p.name_zh ?? ''), String(p.name_en ?? ''), String(p.name))
  const operatorName = localizedText(locale, String(p.operator_name_zh ?? ''), String(p.operator_name_en ?? ''), String(p.operator_name))
  const title = `${productName} | ${siteTitle}`
  const activation = localizedText(locale, String(p.activation_guide_html_zh ?? ''), String(p.activation_guide_html_en ?? ''), String(p.activation_guide_html ?? ''))
  const desc = autoDescription(activation || `${productName} eSIM ${pick(locale, '套餐，支持跳转购买。', 'plan with external purchase link.')}`)
  const data = Number(p.is_unlimited) ? pick(locale, '无限', 'Unlimited') : p.data_gb ? `${Number(p.data_gb)}GB` : '—'
  const price = `${String(p.price_currency)} ${Number(p.price_amount).toFixed(2)}`
  const offers = {
    '@type': 'Offer',
    priceCurrency: String(p.price_currency),
    price: Number(p.price_amount),
    url: String(p.purchase_url),
    availability: 'https://schema.org/InStock'
  }
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    brand: { '@type': 'Brand', name: operatorName },
    offers
  }
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / <a href="/operator/${escapeHtml(String(p.operator_slug))}">${escapeHtml(operatorName)}</a> / ${escapeHtml(productName)}</small></nav>
    <h1>${escapeHtml(productName)}</h1>
    <section class="card" aria-label="Specs">
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '国家', 'Country'))}</small><div><strong>${escapeHtml(String(p.country_iso2).toUpperCase())}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '天数', 'Days'))}</small><div><strong>${escapeHtml(String(p.days))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '流量', 'Data'))}</small><div><strong>${escapeHtml(data)}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '热点', 'Hotspot'))}</small><div><strong>${escapeHtml(Number(p.supports_hotspot) ? pick(locale, '支持', 'Supported') : pick(locale, '不支持', 'Not supported'))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '网络', 'Network'))}</small><div><strong>${escapeHtml(String(p.network_type ?? '—'))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, '价格', 'Price'))}</small><div><strong>${escapeHtml(price)}</strong></div></div>
      </div>
      <div style="height:12px"></div>
      <a class="btn primary" href="${escapeHtml(String(p.purchase_url))}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '购买', 'Buy'))}</a>
      <small style="display:block;margin-top:8px">${escapeHtml(pick(locale, '外链将在新窗口打开，价格以供应商页面为准。', 'External link opens in a new tab. Final price is determined by the operator.'))}</small>
    </section>
    <h2>${escapeHtml(pick(locale, '激活教程', 'Activation Guide'))}</h2>
    <section class="card" aria-label="Activation">${activation || `<p>${escapeHtml(pick(locale, '请按供应商提供的二维码/激活码在系统设置中添加 eSIM。', 'Use the operator QR code or activation code to add the eSIM in your device settings.'))}</p>`}</section>
  </main>
  <footer><small>${escapeHtml(pick(locale, '本站不直接销售 eSIM。', 'This site does not directly sell eSIMs.'))}</small></footer>
  `
  return html(
    layout(
      {
        title,
        description: pick(locale, desc, autoDescription(activation || `${productName} eSIM plan with external purchase link.`)),
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd: [productJsonLd]
      },
      body,
      criticalCss()
    ),
    { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=600' } }
  )
}

export async function countryPage(env: Bindings, req: Request, slug: string): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const c = await db
    .select({
      name: schema.countries.name,
      name_zh: schema.countries.nameZh,
      name_en: schema.countries.nameEn,
      slug: schema.countries.slug,
      iso2: schema.countries.iso2,
      seo_title: schema.countries.seoTitle,
      seo_title_zh: schema.countries.seoTitleZh,
      seo_title_en: schema.countries.seoTitleEn,
      seo_description: schema.countries.seoDescription,
      seo_description_zh: schema.countries.seoDescriptionZh,
      seo_description_en: schema.countries.seoDescriptionEn,
      content_html: schema.countries.contentHtml,
      content_html_zh: schema.countries.contentHtmlZh,
      content_html_en: schema.countries.contentHtmlEn,
      hero_image_key: schema.countries.heroImageKey,
      faq_json: schema.countries.faqJson
    })
    .from(schema.countries)
    .where(and(eq(schema.countries.slug, slug), eq(schema.countries.status, 'published')))
    .limit(1)
    .get() as Country | undefined
  if (!c) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const products = await db
    .select({
      name: schema.products.name,
      name_zh: schema.products.nameZh,
      name_en: schema.products.nameEn,
      slug: schema.products.slug,
      days: schema.products.days,
      data_gb: schema.products.dataGb,
      is_unlimited: schema.products.isUnlimited,
      supports_hotspot: schema.products.supportsHotspot,
      network_type: schema.products.networkType,
      price_amount: schema.products.priceAmount,
      price_currency: schema.products.priceCurrency,
      purchase_url: schema.products.purchaseUrl,
      operator_name: schema.operators.name,
      operator_name_zh: schema.operators.nameZh,
      operator_name_en: schema.operators.nameEn,
      operator_slug: schema.operators.slug
    })
    .from(schema.products)
    .innerJoin(schema.operators, eq(schema.operators.id, schema.products.operatorId))
    .where(and(eq(schema.products.countryIso2, c.iso2), eq(schema.products.status, 'published'), eq(schema.operators.status, 'published')))
    .orderBy(orderAsc(schema.products.priceAmount))
    .limit(100) as Product[]
  const ogImage = c.hero_image_key ? mediaUrl(env.APP_ORIGIN, c.hero_image_key) : undefined
  const canonical = new URL(`/country/${c.slug}`, env.APP_ORIGIN).toString()
  const countryName = localizedText(locale, c.name_zh, c.name_en, c.name)
  const content = localizedText(locale, c.content_html_zh, c.content_html_en, c.content_html ?? '') || `<p>${escapeHtml(pick(locale, `在 ${countryName} 使用 eSIM 上网，支持旅行与商务场景。`, `Use eSIM in ${countryName} for travel and business scenarios.`))}</p>`
  const desc = localizedText(locale, c.seo_description_zh, c.seo_description_en, c.seo_description ?? '') || autoDescription(content)
  const faq = safeJson(c.faq_json)
  const jsonLd: unknown[] = []
  if (Array.isArray(faq) && faq.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq
    })
  }
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/operators', label: pick(locale, 'eSIM服务商', 'eSIM Providers') },
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / ${escapeHtml(countryName)}</small></nav>
    <h1>${escapeHtml(countryName)} eSIM</h1>
    ${c.hero_image_key ? `<img src="${escapeHtml(ogImage ?? '')}" alt="${escapeHtml(countryName)} eSIM" loading="lazy" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;border:1px solid var(--b)" />` : ''}
    <section class="card" aria-label="Guide">${content}</section>
    <h2 style="margin-top:32px">${escapeHtml(pick(locale, '推荐套餐', 'Recommended Plans'))}</h2>
    <div class="card" aria-label="Products">
      <div class="table-wrap">
      <table>
          ${products
            .map((p) => {
              const data = p.is_unlimited ? pick(locale, '无限', 'Unlimited') : p.data_gb ? `${p.data_gb}GB` : '—'
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const operatorName = localizedText(locale, p.operator_name_zh, p.operator_name_en, p.operator_name)
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tbody class="hover-group"><tr><td colspan="5" style="border-bottom:none;padding-bottom:4px"><strong><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(productName)}</a></strong></td></tr>
              <tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(operatorName)}</a></td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '购买', 'Buy'))}</a></td>
              </tr></tbody>`
            })
            .join('')}
      </table>
      </div>
    </div>
  </main>
  <footer><small>${escapeHtml(pick(locale, '价格与覆盖范围以供应商页面为准。', 'Final prices and coverage are subject to operator pages.'))}</small></footer>
  `
  return html(
    layout(
      {
        title: localizedText(locale, c.seo_title_zh, c.seo_title_en, c.seo_title ?? '') || `${countryName} eSIM 套餐与供应商对比 | ${siteTitle}`,
        description: pick(locale, desc, autoDescription(content)),
        canonical,
        ogImage,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd
      },
      body,
      criticalCss()
    ),
    {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600'
      }
    }
  )
}

export async function operatorPage(env: Bindings, req: Request, slug: string): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const db = getDb(env.DB)
  const o = await db
    .select({
      name: schema.operators.name,
      name_zh: schema.operators.nameZh,
      name_en: schema.operators.nameEn,
      slug: schema.operators.slug,
      website_url: schema.operators.websiteUrl,
      seo_title: schema.operators.seoTitle,
      seo_title_zh: schema.operators.seoTitleZh,
      seo_title_en: schema.operators.seoTitleEn,
      seo_description: schema.operators.seoDescription,
      seo_description_zh: schema.operators.seoDescriptionZh,
      seo_description_en: schema.operators.seoDescriptionEn,
      content_html: schema.operators.contentHtml,
      content_html_zh: schema.operators.contentHtmlZh,
      content_html_en: schema.operators.contentHtmlEn,
      logo_image_key: schema.operators.logoImageKey,
      faq_json: schema.operators.faqJson
    })
    .from(schema.operators)
    .where(and(eq(schema.operators.slug, slug), eq(schema.operators.status, 'published')))
    .limit(1)
    .get() as Operator | undefined
  if (!o) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const operatorProducts = await db
    .select({
      slug: schema.products.slug,
      name: schema.products.name,
      name_zh: schema.products.nameZh,
      name_en: schema.products.nameEn,
      days: schema.products.days,
      data_gb: schema.products.dataGb,
      is_unlimited: schema.products.isUnlimited,
      supports_hotspot: schema.products.supportsHotspot,
      network_type: schema.products.networkType,
      price_amount: schema.products.priceAmount,
      price_currency: schema.products.priceCurrency,
      purchase_url: schema.products.purchaseUrl,
      country_iso2: schema.products.countryIso2
    })
    .from(schema.products)
    .innerJoin(schema.operators, eq(schema.operators.id, schema.products.operatorId))
    .where(and(eq(schema.operators.slug, slug), eq(schema.products.status, 'published')))
    .orderBy(orderAsc(schema.products.priceAmount))
    .limit(200)
  const products = operatorProducts
  const ogImage = o.logo_image_key ? mediaUrl(env.APP_ORIGIN, o.logo_image_key) : undefined
  const canonical = new URL(`/operator/${o.slug}`, env.APP_ORIGIN).toString()
  const operatorName = localizedText(locale, o.name_zh, o.name_en, o.name)
  const content = localizedText(locale, o.content_html_zh, o.content_html_en, o.content_html ?? '') || `<p>${escapeHtml(pick(locale, `${operatorName} 提供覆盖多个国家/地区的 eSIM 套餐。`, `${operatorName} offers eSIM plans covering multiple countries and regions.`))}</p>`
  const desc = localizedText(locale, o.seo_description_zh, o.seo_description_en, o.seo_description ?? '') || autoDescription(content)
  const faq = safeJson(o.faq_json)
  const uniqueCountries = new Set(products.map((p) => p.country_iso2.toUpperCase()))
  const minPrice = products.length > 0 ? `${products[0].price_currency} ${products[0].price_amount.toFixed(2)}` : pick(locale, '暂无套餐', 'No plans yet')
  const networkTags = Array.from(new Set(products.map((p) => p.network_type ?? '4G/5G').filter(Boolean))).slice(0, 4)
  const jsonLd: unknown[] = []
  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: operatorName,
    url: o.website_url
  })
  if (Array.isArray(faq) && faq.length > 0) {
    jsonLd.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })
  }
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="hero" aria-label="Provider Hero">
      <div class="card">
        <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / ${escapeHtml(pick(locale, '供应商', 'Operator'))} / ${escapeHtml(operatorName)}</small></nav>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:8px 0 14px">
          ${ogImage ? `<img src="${escapeHtml(ogImage)}" alt="${escapeHtml(operatorName)} logo" width="72" height="72" loading="lazy" class="inline-media" />` : ''}
          <div>
            <span class="eyebrow">${escapeHtml(pick(locale, '供应商目录', 'Operator Directory'))}</span>
            <h1>${escapeHtml(operatorName)} eSIM ${escapeHtml(pick(locale, '套餐', 'Plans'))}</h1>
            <p>${escapeHtml(pick(locale, `查看 ${operatorName} 的套餐价格、覆盖国家、网络类型与购买入口，风格与首页保持一致的卡片式目录体验。`, `Review ${operatorName} plan pricing, coverage, network type, and purchase links in a layout aligned with the homepage.`))}</p>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat"><small>${escapeHtml(pick(locale, '已发布套餐', 'Published plans'))}</small><strong>${products.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, '覆盖国家', 'Countries covered'))}</small><strong>${uniqueCountries.size}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, '最低价格', 'Lowest price'))}</small><strong>${escapeHtml(minPrice)}</strong></div>
        </div>
      </div>
      <aside class="card muted-panel">
        <h2>${escapeHtml(pick(locale, '快速操作', 'Quick Actions'))}</h2>
        <div class="meta-list">
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, '官网入口', 'Official site'))}</small>
            <a class="btn primary" href="${escapeHtml(o.website_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '访问官网', 'Visit website'))}</a>
          </div>
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, '覆盖网络', 'Network types'))}</small>
            <div class="badge-list">
              ${networkTags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join('') || `<span class="badge">${escapeHtml(pick(locale, '套餐待补充', 'Plans coming soon'))}</span>`}
            </div>
          </div>
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, '外链说明', 'External link notice'))}</small>
            <p>${escapeHtml(pick(locale, '价格与库存以供应商官网为准，购买页将在新窗口打开。', 'Pricing and stock depend on the operator website. Purchase links open in a new tab.'))}</p>
          </div>
        </div>
      </aside>
    </section>
    <section class="detail-layout">
      <div class="section-gap">
        <section class="card content-prose" aria-label="Content">
          <h2>${escapeHtml(pick(locale, '供应商介绍', 'About the operator'))}</h2>
          ${content}
        </section>
        <section class="card" aria-label="Price table">
          <h2>${escapeHtml(pick(locale, '价格表', 'Pricing'))}</h2>
          <div class="table-wrap">
          <table>
          ${products
            .map((p) => {
              const data = p.is_unlimited ? pick(locale, '无限', 'Unlimited') : p.data_gb ? `${p.data_gb}GB` : '—'
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tbody class="hover-group"><tr><td colspan="5" style="border-bottom:none;padding-bottom:4px"><strong><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(productName)}</a></strong></td></tr>
              <tr>
                <td>${escapeHtml(p.country_iso2.toUpperCase())}</td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '购买', 'Buy'))}</a></td>
              </tr></tbody>`
            })
            .join('')}
      </table>
          </div>
        </section>
        ${Array.isArray(faq) && faq.length > 0 ? `<section class="card" aria-label="FAQ"><h2>${escapeHtml(pick(locale, '常见问题', 'FAQ'))}</h2><div class="faq-list">${faq
          .map((item) => {
            const q = typeof item === 'object' && item && 'name' in item ? String((item as Record<string, unknown>).name ?? '') : ''
            const accepted = typeof item === 'object' && item && 'acceptedAnswer' in item ? (item as Record<string, unknown>).acceptedAnswer : null
            const a = typeof accepted === 'object' && accepted && 'text' in accepted ? String((accepted as Record<string, unknown>).text ?? '') : ''
            return `<article class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></article>`
          })
          .join('')}</div></section>` : ''}
      </div>
      <aside class="section-gap">
        <section class="soft-card">
          <h3>${escapeHtml(pick(locale, '目录摘要', 'Directory Summary'))}</h3>
          <div class="meta-list">
            <div class="meta-item"><small>${escapeHtml(pick(locale, '供应商名称', 'Operator'))}</small><strong>${escapeHtml(operatorName)}</strong></div>
            <div class="meta-item"><small>${escapeHtml(pick(locale, '覆盖国家', 'Countries covered'))}</small><strong>${uniqueCountries.size} ${escapeHtml(pick(locale, '个', 'countries'))}</strong></div>
            <div class="meta-item"><small>${escapeHtml(pick(locale, '套餐更新', 'Sort order'))}</small><strong>${escapeHtml(pick(locale, '按价格升序展示', 'Ordered by ascending price'))}</strong></div>
          </div>
        </section>
        <section class="soft-card">
          <h3>${escapeHtml(pick(locale, '推荐浏览', 'Recommended next steps'))}</h3>
          <div class="meta-list">
            <a class="btn" href="/search?q=${encodeURIComponent(operatorName)}">${escapeHtml(pick(locale, '搜索同名套餐', 'Search matching plans'))}</a>
            <a class="btn" href="/posts">${escapeHtml(pick(locale, '查看 SIM卡资讯', 'Read SIM card news'))}</a>
          </div>
        </section>
      </aside>
    </section>
  </main>
  <footer><small>${escapeHtml(pick(locale, '本站不直接销售 eSIM。', 'This site does not directly sell eSIMs.'))}</small></footer>
  `
  return html(
    layout(
      {
        title: localizedText(locale, o.seo_title_zh, o.seo_title_en, o.seo_title ?? '') || `${operatorName} eSIM 套餐与覆盖国家 | ${siteTitle}`,
        description: pick(locale, desc, autoDescription(content)),
        canonical,
        ogImage,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd
      },
      body,
      criticalCss()
    ),
    {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600'
      }
    }
  )
}

function safeJson(input: string | null): unknown {
  if (!input) return null
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

