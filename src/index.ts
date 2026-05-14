import type { Bindings } from './env'
import { and, eq, isNotNull, lte } from 'drizzle-orm'
import * as schema from './db/schema'
import { Router } from './lib/router'
import { cacheGet, cachePut } from './lib/cache'
import { getDb } from './lib/db'
import { notFound } from './lib/http'
import { bootstrapAdminIfNeeded } from './lib/db'
import { getObjectResponse } from './lib/media'
import { makeLocaleCookie, normalizeLocale, resolveLocale, sanitizeRedirectPath } from './lib/i18n'
import { homePage, countryPage, operatorPage, searchPage, productPage, postsIndexPage, postPage, postCategoryPage } from './pages/public'
import { adminHomePage, adminLoginPage, adminListPage, apiAdminLogin, apiAdminLogout, apiAdminRefresh } from './pages/admin'
import { robotsTxt, sitemapXml } from './pages/system'
import { apiPublicCountry, apiPublicOperator, apiPublicSearch } from './pages/api-public'
import { apiAdminUpload } from './pages/api-admin-media'
import {
  adminEditCategoryPage,
  adminSaveCategory,
  adminEditCountryPage,
  adminSaveCountry,
  adminEditOperatorPage,
  adminSaveOperator,
  adminEditProductPage,
  adminSaveProduct,
  adminEditPostPage,
  adminSavePost,
  adminSiteSettingsPage,
  adminSaveSiteSettings,
  adminMediaPage,
  adminMediaUpload
} from './pages/admin-edit'
import { adminImportExportPage, apiAdminExport, apiAdminImport } from './pages/admin-import'

const router = new Router()

router.on('GET', '/', async ({ req }) => withHtmlCache(req, (env) => homePage(env, req)))
router.on('GET', '/search', async ({ req }) => withHtmlCache(req, (env) => searchPage(env, req)))
router.on('GET', '/posts', async ({ req }) => withHtmlCache(req, (env) => postsIndexPage(env, req)))
router.on('GET', '/posts/category/:slug', async ({ req, params }) => withHtmlCache(req, (env) => postCategoryPage(env, req, params.slug)))
router.on('GET', '/post/:slug', async ({ req, params }) => withHtmlCache(req, (env) => postPage(env, req, params.slug)))
router.on('GET', '/country/:slug', async ({ req, params }) => withHtmlCache(req, (env) => countryPage(env, req, params.slug)))
router.on('GET', '/operator/:slug', async ({ req, params }) => withHtmlCache(req, (env) => operatorPage(env, req, params.slug)))
router.on('GET', '/product/:slug', async ({ req, params }) => withHtmlCache(req, (env) => productPage(env, req, params.slug)))
router.on('GET', '/set-language', async ({ req }) => {
  const url = new URL(req.url)
  const lang = normalizeLocale(url.searchParams.get('lang'))
  if (!lang) return notFound()
  const redirectTo = sanitizeRedirectPath(url.searchParams.get('redirect'))
  const headers = new Headers({ 'Location': redirectTo, 'Cache-Control': 'no-store' })
  headers.append('Set-Cookie', makeLocaleCookie(req, lang))
  return new Response(null, { status: 302, headers })
})

router.on('GET', '/admin/login', async ({ req }) => adminLoginPage((req as any).env, req))
router.on('GET', '/admin', async ({ req }) => adminHomePage((req as any).env, req))
router.on('GET', '/admin/categories', async ({ req }) => adminListPage((req as any).env, req, 'categories'))
router.on('GET', '/admin/categories/new', async ({ req }) => adminEditCategoryPage((req as any).env, req, null))
router.on('POST', '/admin/categories/new', async ({ req }) => adminSaveCategory((req as any).env, req, null))
router.on('GET', '/admin/categories/:id', async ({ req, params }) => adminEditCategoryPage((req as any).env, req, params.id))
router.on('POST', '/admin/categories/:id', async ({ req, params }) => adminSaveCategory((req as any).env, req, params.id))
router.on('GET', '/admin/countries', async ({ req }) => adminListPage((req as any).env, req, 'countries'))
router.on('GET', '/admin/countries/new', async ({ req }) => adminEditCountryPage((req as any).env, req, null))
router.on('POST', '/admin/countries/new', async ({ req }) => adminSaveCountry((req as any).env, req, null))
router.on('GET', '/admin/countries/:id', async ({ req, params }) => adminEditCountryPage((req as any).env, req, params.id))
router.on('POST', '/admin/countries/:id', async ({ req, params }) => adminSaveCountry((req as any).env, req, params.id))
router.on('GET', '/admin/operators', async ({ req }) => adminListPage((req as any).env, req, 'operators'))
router.on('GET', '/admin/operators/new', async ({ req }) => adminEditOperatorPage((req as any).env, req, null))
router.on('POST', '/admin/operators/new', async ({ req }) => adminSaveOperator((req as any).env, req, null))
router.on('GET', '/admin/operators/:id', async ({ req, params }) => adminEditOperatorPage((req as any).env, req, params.id))
router.on('POST', '/admin/operators/:id', async ({ req, params }) => adminSaveOperator((req as any).env, req, params.id))
router.on('GET', '/admin/products', async ({ req }) => adminListPage((req as any).env, req, 'products'))
router.on('GET', '/admin/products/new', async ({ req }) => adminEditProductPage((req as any).env, req, null))
router.on('POST', '/admin/products/new', async ({ req }) => adminSaveProduct((req as any).env, req, null))
router.on('GET', '/admin/products/:id', async ({ req, params }) => adminEditProductPage((req as any).env, req, params.id))
router.on('POST', '/admin/products/:id', async ({ req, params }) => adminSaveProduct((req as any).env, req, params.id))
router.on('GET', '/admin/posts', async ({ req }) => adminListPage((req as any).env, req, 'posts'))
router.on('GET', '/admin/posts/new', async ({ req }) => adminEditPostPage((req as any).env, req, null))
router.on('POST', '/admin/posts/new', async ({ req }) => adminSavePost((req as any).env, req, null))
router.on('GET', '/admin/posts/:id', async ({ req, params }) => adminEditPostPage((req as any).env, req, params.id))
router.on('POST', '/admin/posts/:id', async ({ req, params }) => adminSavePost((req as any).env, req, params.id))
router.on('GET', '/admin/settings', async ({ req }) => adminSiteSettingsPage((req as any).env, req))
router.on('POST', '/admin/settings', async ({ req }) => adminSaveSiteSettings((req as any).env, req))

router.on('GET', '/admin/import-export', async ({ req }) => adminImportExportPage((req as any).env, req))

router.on('GET', '/admin/media', async ({ req }) => {
  const env = (req as any).env as Bindings
  const url = new URL(req.url)
  const uploaded = url.searchParams.get('uploaded') ?? undefined
  return adminMediaPage(env, req, uploaded)
})
router.on('POST', '/admin/media', async ({ req }) => adminMediaUpload((req as any).env, req))

router.on('POST', '/api/admin/auth/login', async ({ req }) => apiAdminLogin((req as any).env, req))
router.on('POST', '/api/admin/auth/logout', async ({ req }) => apiAdminLogout((req as any).env, req))
router.on('POST', '/api/admin/auth/refresh', async ({ req }) => apiAdminRefresh((req as any).env, req))
router.on('POST', '/api/admin/media/upload', async ({ req }) => apiAdminUpload((req as any).env, req))
router.on('GET', '/api/admin/export', async ({ req }) => apiAdminExport((req as any).env, req))
router.on('POST', '/api/admin/import', async ({ req }) => apiAdminImport((req as any).env, req))

router.on('GET', '/api/public/search', async ({ req }) => withApiCache(req, (env) => apiPublicSearch(env, req), 60))
router.on('GET', '/api/public/country/:slug', async ({ req, params }) => withApiCache(req, (env) => apiPublicCountry(env, params.slug), 120))
router.on('GET', '/api/public/operator/:slug', async ({ req, params }) => withApiCache(req, (env) => apiPublicOperator(env, params.slug), 120))

router.on('GET', '/robots.txt', async ({ req }) => robotsTxt((req as any).env))
router.on('GET', '/sitemap.xml', async ({ req }) => sitemapXml((req as any).env))
router.on('GET', '/media/:key', async ({ req, params }) => {
  const env = (req as any).env as Bindings
  const r = await getObjectResponse(env, params.key)
  return r ?? notFound()
})

async function withHtmlCache(req: Request, render: (env: Bindings) => Promise<Response>): Promise<Response> {
  const env = (req as any).env as Bindings
  const url = new URL(req.url)
  const bypass = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')
  if (!bypass) {
    const locale = resolveLocale(req)
    const cacheUrl = new URL(req.url)
    cacheUrl.searchParams.set('__hl', locale)
    const cacheKey = new Request(cacheUrl.toString())
    const hit = await cacheGet(cacheKey)
    if (hit) {
      const hitRes = new Response(hit.body, hit)
      hitRes.headers.set('Cache-Control', 's-maxage=60, no-cache')
      return hitRes
    }
    const res = await render(env)
    const resHeaders = new Headers(res.headers)
    resHeaders.set('Cache-Control', 's-maxage=60, no-cache')
    const finalRes = new Response(res.body, { status: res.status, headers: resHeaders })
    await cachePut(cacheKey, finalRes.clone(), 60)
    return finalRes
  }
  return render(env)
}

async function withApiCache(req: Request, handle: (env: Bindings) => Promise<Response>, ttlSeconds: number): Promise<Response> {
  const env = (req as any).env as Bindings
  const hit = await cacheGet(req)
  if (hit) {
    const hitRes = new Response(hit.body, hit)
    hitRes.headers.set('Cache-Control', `s-maxage=${ttlSeconds}, no-cache`)
    return hitRes
  }
  const res = await handle(env)
  const resHeaders = new Headers(res.headers)
  resHeaders.set('Cache-Control', `s-maxage=${ttlSeconds}, no-cache`)
  const finalRes = new Response(res.body, { status: res.status, headers: resHeaders })
  await cachePut(req, finalRes.clone(), ttlSeconds)
  return finalRes
}

async function incr(env: Bindings, key: string): Promise<void> {
  const v = await env.KV.get(key)
  const n = (v ? parseInt(v, 10) : 0) + 1
  await env.KV.put(key, String(n))
}

export default {
  async fetch(req: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    ;(req as any).env = env
    ctx.waitUntil(bootstrapAdminIfNeeded(env))

    const url = new URL(req.url)
    if (req.method === 'GET') {
      if (url.pathname.startsWith('/country/')) ctx.waitUntil(incr(env, `views:country:${url.pathname.slice('/country/'.length)}`))
      if (url.pathname.startsWith('/operator/')) ctx.waitUntil(incr(env, `views:operator:${url.pathname.slice('/operator/'.length)}`))
      if (url.pathname.startsWith('/product/')) ctx.waitUntil(incr(env, `views:product:${url.pathname.slice('/product/'.length)}`))
    }
    const res = await router.route(req)
    return res ?? notFound()
  },
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const now = new Date().toISOString()
    const db = getDb(env.DB)
    const publishTargets = [schema.countries, schema.operators, schema.products, schema.posts] as const
    const publish = async (table: (typeof publishTargets)[number]) => {
      await db
        .update(table)
        .set({ status: 'published', publishedAt: now, updatedAt: now })
        .where(and(eq(table.status, 'scheduled'), isNotNull(table.publishAt), lte(table.publishAt, now)))
    }
    ctx.waitUntil(Promise.all(publishTargets.map((table) => publish(table))).then(() => undefined))
  }
}

