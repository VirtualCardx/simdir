import type { Bindings } from '../env'
import { dbAll, dbGet } from '../lib/db'
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
  category_slug: string | null
  published_at: string | null
  updated_at: string
}
type SearchCountry = { name: string; name_zh: string | null; name_en: string | null; slug: string; iso2: string }
type SearchOperator = { name: string; name_zh: string | null; name_en: string | null; slug: string; logo_image_key: string | null }
type CategorySummary = { name: string; slug: string; post_count: number }

function localizedText(locale: SiteLocale, zh: string | null | undefined, en: string | null | undefined, fallback: string): string {
  const primary = locale === 'zh' ? zh : en
  const secondary = locale === 'zh' ? en : zh
  return (primary ?? '').trim() || (secondary ?? '').trim() || fallback
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

export async function homePage(env: Bindings, req: Request): Promise<Response> {
  const locale = resolveLocale(req)
  const site = await getSiteSettings(env)
  const siteTitle = resolveSiteTitle(env, site, locale)
  const faviconHref = resolveSiteFaviconUrl(env, site) ?? undefined
  const [countries, operators, postCategories] = await Promise.all([
    dbAll<{ name: string; name_zh: string | null; name_en: string | null; slug: string }>(
      env.DB,
      "SELECT name, name_zh, name_en, slug FROM countries WHERE status='published' ORDER BY COALESCE(name_en, name_zh, name) ASC LIMIT 60"
    ),
    dbAll<{ name: string; name_zh: string | null; name_en: string | null; slug: string; logo_image_key: string | null }>(
      env.DB,
      "SELECT name, name_zh, name_en, slug, logo_image_key FROM operators WHERE status='published' ORDER BY updated_at DESC LIMIT 12"
    ),
    dbAll<CategorySummary>(
      env.DB,
      "SELECT c.name, c.slug, COUNT(DISTINCT COALESCE(NULLIF(p.ref_slug, ''), p.slug)) as post_count FROM categories c LEFT JOIN posts p ON p.category_id=c.id AND p.status='published' GROUP BY c.id, c.name, c.slug ORDER BY post_count DESC, c.sort_order ASC, c.name ASC LIMIT 8"
    )
  ])
  const body = `
  ${publicHeader(env, req, locale, site, [
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
          .map((c) => `<a class="card card-link" href="/posts/category/${escapeHtml(c.slug)}"><div><strong>${escapeHtml(c.name)}</strong><div><small>${escapeHtml(String(c.post_count))} ${escapeHtml(pick(locale, '篇文章', 'articles'))}</small></div></div></a>`)
          .join('')}
      </div>
    </section>
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
  const params: unknown[] = []
  const where = ["p.status='published'"]
  if (category) {
    where.push('c.slug=?')
    params.push(category)
  }
  if (lang) {
    where.push('lower(p.locale) LIKE ?')
    params.push(`${lang}%`)
  }
  const [posts, categories] = await Promise.all([
    dbAll<Post>(
      env.DB,
      `SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where.join(' AND ')} ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 200`,
      params
    ),
    dbAll<{ name: string; slug: string }>(env.DB, 'SELECT name, slug FROM categories ORDER BY sort_order ASC, name ASC LIMIT 100')
  ])
  const canonical = new URL(postsUrl(category, lang), env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main class="section-gap posts-page">
    <section class="card muted-panel posts-section">
      <h2>${escapeHtml(pick(locale, '文章类型', 'Article Types'))}</h2>
      <div class="chip-row">
        <a class="btn ${!category ? 'primary' : ''}" href="${postsUrl('', lang)}">${escapeHtml(pick(locale, '全部资讯', 'All Articles'))}</a>
        ${categories.map((c) => `<a class="btn ${category === c.slug ? 'primary' : ''}" href="${postsUrl(c.slug, lang)}">${escapeHtml(c.name)}</a>`).join('')}
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
                <small>${escapeHtml(date)}</small>
                <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
                ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, lang)}">${escapeHtml(p.category_name)}</a>` : ''}
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
  const category = await dbGet<{ id: string; name: string; slug: string }>(env.DB, 'SELECT id, name, slug FROM categories WHERE slug=?', [slug])
  if (!category) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const sql =
    "SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND p.category_id=?"
    + (lang ? " AND lower(p.locale) LIKE ?" : '')
    + " ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 200"
  const posts = await dbAll<Post>(
    env.DB,
    sql,
    lang ? [category.id, `${lang}%`] : [category.id]
  )
  const categoryUrl = `/posts/category/${category.slug}`
  const canonical = new URL(categoryUrl, env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">首页</a> / <a href="/posts">${escapeHtml(pick(locale, 'SIM卡资讯', 'SIM Card News'))}</a> / ${escapeHtml(category.name)}</small></nav>
      <div>
        <span class="eyebrow">${escapeHtml(pick(locale, '分类页', 'Category'))}</span>
        <h1>${escapeHtml(category.name)}</h1>
        <p>${escapeHtml(pick(locale, '浏览', 'Browse'))} ${escapeHtml(category.name)} ${escapeHtml(pick(locale, '分类下已发布的文章内容，并跟随全站语言显示。', 'published articles in this category, following the current site language.'))}</p>
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
              <div><small>${escapeHtml(date)}</small></div>
              <div><small>${escapeHtml(localeLabel(p.locale))}</small></div>
              ${p.excerpt ? `<div><small>${escapeHtml(p.excerpt)}</small></div>` : ''}
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
        title: `${category.name} | ${siteTitle}`,
        description: pick(locale, `${category.name} 分类下的 SIM卡资讯文章。`, `SIM card news articles under ${category.name}.`),
        canonical,
        keywords: resolveSiteKeywords(site, locale) || undefined,
        faviconHref,
        locale: locale === 'zh' ? 'zh-CN' : 'en',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
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
  const p = await dbGet<Post>(
    env.DB,
    "SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status='published' ORDER BY CASE WHEN lower(p.locale) LIKE ? THEN 0 ELSE 1 END, COALESCE(p.published_at, p.updated_at) DESC LIMIT 1",
    [slug, `${locale}%`]
  )
  if (!p) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const canonical = new URL(`/post/${p.slug}`, env.APP_ORIGIN).toString()
  const ogImage = p.cover_image_key ? mediaUrl(env.APP_ORIGIN, p.cover_image_key) : undefined
  const desc = p.excerpt ?? autoDescription(p.content_html)
  const published = p.published_at ?? p.updated_at
  const related = p.category_slug
    ? await dbAll<{ title: string; slug: string }>(
        env.DB,
        "SELECT p.title, p.slug FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND c.slug=? AND p.slug<>? AND lower(p.locale) LIKE ? ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 4",
        [p.category_slug, p.slug, `${normalizeLocale(p.locale) || 'en'}%`]
      )
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
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">首页</a> / <a href="/posts">${escapeHtml(pick(locale, 'SIM卡资讯', 'SIM Card News'))}</a>${p.category_name && p.category_slug ? ` / <a href="/posts?category=${encodeURIComponent(p.category_slug)}">${escapeHtml(p.category_name)}</a>` : ''} / ${escapeHtml(p.title)}</small></nav>
      <div>
        <h1>${escapeHtml(p.title)}</h1>
        <small>${escapeHtml(published)}</small>
        <div class="chip-row" style="margin-top:8px">
          <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
          ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, normalizeLocale(p.locale))}">${escapeHtml(p.category_name)}</a>` : ''}
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
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const country = (url.searchParams.get('country') ?? '').trim().toLowerCase()
  const qLike = q ? `%${q.toLowerCase()}%` : null
  const [countries, operators, products] = await Promise.all([
    qLike
      ? dbAll<SearchCountry>(
          env.DB,
          "SELECT name, name_zh, name_en, slug, iso2 FROM countries WHERE status='published' AND (lower(name) LIKE ? OR lower(COALESCE(name_zh, '')) LIKE ? OR lower(COALESCE(name_en, '')) LIKE ? OR lower(slug) LIKE ? OR lower(iso2) LIKE ?) ORDER BY COALESCE(name_en, name_zh, name) ASC LIMIT 12",
          [qLike, qLike, qLike, qLike, qLike]
        )
      : Promise.resolve([]),
    qLike
      ? dbAll<SearchOperator>(
          env.DB,
          "SELECT name, name_zh, name_en, slug, logo_image_key FROM operators WHERE status='published' AND (lower(name) LIKE ? OR lower(COALESCE(name_zh, '')) LIKE ? OR lower(COALESCE(name_en, '')) LIKE ? OR lower(slug) LIKE ?) ORDER BY updated_at DESC LIMIT 12",
          [qLike, qLike, qLike, qLike]
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
        where.push("(lower(p.name) LIKE ? OR lower(COALESCE(p.name_zh, '')) LIKE ? OR lower(COALESCE(p.name_en, '')) LIKE ? OR lower(o.name) LIKE ? OR lower(COALESCE(o.name_zh, '')) LIKE ? OR lower(COALESCE(o.name_en, '')) LIKE ? OR lower(c.name) LIKE ? OR lower(COALESCE(c.name_zh, '')) LIKE ? OR lower(COALESCE(c.name_en, '')) LIKE ? OR lower(c.slug) LIKE ? OR lower(c.iso2) LIKE ?)")
        params.push(qLike, qLike, qLike, qLike, qLike, qLike, qLike, qLike, qLike, qLike, qLike)
      }
      return dbAll<Product>(
        env.DB,
        `SELECT p.name, p.name_zh, p.name_en, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, o.name as operator_name, o.name_zh as operator_name_zh, o.name_en as operator_name_en, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id JOIN countries c ON c.iso2=p.country_iso2 WHERE ${where.join(' AND ')} ORDER BY p.price_amount ASC LIMIT 100`,
        params
      )
    })()
  ])
  const canonical = new URL(`/search?${url.searchParams.toString()}`, env.APP_ORIGIN).toString()
  const body = `
  ${publicHeader(env, req, locale, site, [
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
        <thead><tr><th>供应商</th><th>套餐</th><th>天数</th><th>流量</th><th>价格</th><th></th></tr></thead>
        <tbody>
          ${products.length > 0 ? products
            .map((p) => {
              const data = p.is_unlimited ? '无限' : p.data_gb ? `${p.data_gb}GB` : '—'
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const operatorName = localizedText(locale, p.operator_name_zh, p.operator_name_en, p.operator_name)
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(operatorName)}</a></td>
                <td><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(productName)}</a></td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">去购买</a></td>
              </tr>`
            })
            .join('') : '<tr><td colspan="6"><small>暂无匹配套餐，请尝试国家名、供应商名或更短的关键词。</small></td></tr>'}
        </tbody>
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
  const p = await dbGet<Record<string, unknown>>(
    env.DB,
    "SELECT p.id, p.name, p.name_zh, p.name_en, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, p.coverage_regions_json, p.activation_guide_html, p.activation_guide_html_zh, p.activation_guide_html_en, p.country_iso2, o.name as operator_name, o.name_zh as operator_name_zh, o.name_en as operator_name_en, o.slug as operator_slug, o.website_url as operator_website, p.status, p.updated_at FROM products p JOIN operators o ON o.id=p.operator_id WHERE p.slug=? AND p.status='published' AND o.status='published'",
    [slug]
  )
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
      <a class="btn primary" href="${escapeHtml(String(p.purchase_url))}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '去购买', 'Buy now'))}</a>
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
  const c = await dbGet<Country>(
    env.DB,
    "SELECT name, name_zh, name_en, slug, iso2, seo_title, seo_title_zh, seo_title_en, seo_description, seo_description_zh, seo_description_en, content_html, content_html_zh, content_html_en, hero_image_key, faq_json FROM countries WHERE slug=? AND status='published'",
    [slug]
  )
  if (!c) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const products = await dbAll<Product>(
    env.DB,
    "SELECT p.name, p.name_zh, p.name_en, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, o.name as operator_name, o.name_zh as operator_name_zh, o.name_en as operator_name_en, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id WHERE p.country_iso2=? AND p.status='published' AND o.status='published' ORDER BY p.price_amount ASC LIMIT 100",
    [c.iso2]
  )
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
    { href: '/posts', label: pick(locale, 'SIM卡资讯', 'SIM Card News') }
  ])}
  <main>
    <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, '首页', 'Home'))}</a> / ${escapeHtml(countryName)}</small></nav>
    <h1>${escapeHtml(countryName)} eSIM</h1>
    ${c.hero_image_key ? `<img src="${escapeHtml(ogImage ?? '')}" alt="${escapeHtml(countryName)} eSIM" loading="lazy" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;border:1px solid var(--b)" />` : ''}
    <section class="card" aria-label="Guide">${content}</section>
    <h2>${escapeHtml(pick(locale, '推荐套餐', 'Recommended Plans'))}</h2>
    <div class="card" aria-label="Products">
      <table>
        <thead><tr><th>${escapeHtml(pick(locale, '供应商', 'Operator'))}</th><th>${escapeHtml(pick(locale, '套餐', 'Plan'))}</th><th>${escapeHtml(pick(locale, '天数', 'Days'))}</th><th>${escapeHtml(pick(locale, '流量', 'Data'))}</th><th>${escapeHtml(pick(locale, '热点', 'Hotspot'))}</th><th>${escapeHtml(pick(locale, '价格', 'Price'))}</th><th></th></tr></thead>
        <tbody>
          ${products
            .map((p) => {
              const data = p.is_unlimited ? pick(locale, '无限', 'Unlimited') : p.data_gb ? `${p.data_gb}GB` : '—'
              const hotspot = p.supports_hotspot ? pick(locale, '支持', 'Supported') : pick(locale, '不支持', 'Not supported')
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const operatorName = localizedText(locale, p.operator_name_zh, p.operator_name_en, p.operator_name)
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(operatorName)}</a></td>
                <td>${escapeHtml(productName)}</td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(hotspot)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '去购买', 'Buy now'))}</a></td>
              </tr>`
            })
            .join('')}
        </tbody>
      </table>
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
  const o = await dbGet<Operator>(
    env.DB,
    "SELECT name, name_zh, name_en, slug, website_url, seo_title, seo_title_zh, seo_title_en, seo_description, seo_description_zh, seo_description_en, content_html, content_html_zh, content_html_en, logo_image_key, faq_json FROM operators WHERE slug=? AND status='published'",
    [slug]
  )
  if (!o) return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
  const products = await dbAll<{ slug: string; name: string; name_zh: string | null; name_en: string | null; days: number; data_gb: number | null; is_unlimited: number; supports_hotspot: number; network_type: string | null; price_amount: number; price_currency: string; purchase_url: string; country_iso2: string }>(
    env.DB,
    "SELECT slug, name, name_zh, name_en, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, country_iso2 FROM products WHERE operator_id=(SELECT id FROM operators WHERE slug=?) AND status='published' ORDER BY price_amount ASC LIMIT 200",
    [slug]
  )
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
        <thead><tr><th>${escapeHtml(pick(locale, '套餐', 'Plan'))}</th><th>${escapeHtml(pick(locale, '国家', 'Country'))}</th><th>${escapeHtml(pick(locale, '天数', 'Days'))}</th><th>${escapeHtml(pick(locale, '流量', 'Data'))}</th><th>${escapeHtml(pick(locale, '网络', 'Network'))}</th><th>${escapeHtml(pick(locale, '价格', 'Price'))}</th><th></th></tr></thead>
        <tbody>
          ${products
            .map((p) => {
              const data = p.is_unlimited ? pick(locale, '无限', 'Unlimited') : p.data_gb ? `${p.data_gb}GB` : '—'
              const net = p.network_type ?? '—'
              const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`
              const productName = localizedText(locale, p.name_zh, p.name_en, p.name)
              return `<tr>
                <td><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(productName)}</a></td>
                <td>${escapeHtml(p.country_iso2.toUpperCase())}</td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(net)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, '去购买', 'Buy now'))}</a></td>
              </tr>`
            })
            .join('')}
        </tbody>
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

