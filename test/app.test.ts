import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Miniflare } from 'miniflare'
import { readFile, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)

describe('public pages', () => {
  let mf: Miniflare
  let adminCookieHeader = ''

  beforeAll(async () => {
    await mkdir(join(root, 'dist'), { recursive: true })
    const outFile = join(root, 'dist/worker.mjs')
    await build({
      entryPoints: [join(root, 'src/index.ts')],
      outfile: outFile,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      bundle: true,
      sourcemap: false
    })
    mf = new Miniflare({
      scriptPath: outFile,
      modules: true,
      compatibilityDate: '2026-05-12',
      d1Databases: { DB: 'DB' },
      kvNamespaces: ['KV'],
      r2Buckets: ['R2'],
      bindings: {
        APP_ORIGIN: 'http://localhost:8787',
        SITE_NAME: 'Global eSIM Directory',
        JWT_ISSUER: 'esim-directory',
        JWT_SECRET: 'test-secret',
        BOOTSTRAP_ADMIN: 'false',
        ACCESS_TOKEN_TTL_SECONDS: '900',
        REFRESH_TOKEN_TTL_SECONDS: '2592000'
      }
    })
    const bindings = (await mf.getBindings()) as unknown as { DB: D1Database }
    const migrationDir = join(root, 'migrations')
    const files = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort()
    for (const file of files) {
      const sql = await readFile(join(migrationDir, file), 'utf-8')
      for (const stmt of sql.split(';')) {
        const s = stmt.trim()
        if (!s) continue
        await bindings.DB.prepare(s).run()
      }
    }
    await bindings.DB.prepare("INSERT INTO categories (id,name,slug,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?)")
      .bind('cat1', 'Activation Guides', 'activation-guides', 1, new Date().toISOString(), new Date().toISOString())
      .run()
    await bindings.DB.prepare(
      "INSERT INTO countries (id,iso2,name,slug,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)"
    )
      .bind('c1', 'jp', 'Japan', 'japan', 'published', new Date().toISOString(), new Date().toISOString())
      .run()
    await bindings.DB.prepare(
      "INSERT INTO operators (id,name,slug,website_url,logo_image_key,faq_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    )
      .bind('o1', 'Airalo', 'airalo', 'https://www.airalo.com', null, '[]', 'published', new Date().toISOString(), new Date().toISOString())
      .run()
    await bindings.DB.prepare(
      "INSERT INTO posts (id,category_id,post_type,ref_slug,title,slug,excerpt,content_html,cover_image_key,locale,status,publish_at,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    )
      .bind(
        'p1',
        'cat1',
        'guide',
        null,
        'How to activate eSIM',
        'activate-esim',
        'Step-by-step activation guide.',
        '<p>Install via QR code.</p>',
        null,
        'en',
        'published',
        null,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run()
    await bindings.DB.prepare(
      "INSERT INTO posts (id,category_id,post_type,ref_slug,title,slug,excerpt,content_html,cover_image_key,locale,status,publish_at,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    )
      .bind(
        'p2',
        'cat1',
        'guide',
        null,
        'eSIM 安装教程',
        'esim-install-cn',
        '中文安装教程。',
        '<p>使用二维码安装。</p>',
        null,
        'zh',
        'published',
        null,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run()

    const token = await makeAccessToken('test-secret', 'esim-directory')
    adminCookieHeader = `access_token=${token}`
  })

  afterAll(async () => {
    await mf.dispose()
  })

  it('GET / returns html', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/')
    expect(res.status).toBe(200)
    const ct = res.headers.get('content-type') ?? ''
    expect(ct.includes('text/html')).toBe(true)
    const body = await res.text()
    expect(body.includes('<!doctype html>')).toBe(true)
    expect(body.includes('Japan')).toBe(true)
    expect(body.includes('Airalo')).toBe(true)
    expect(body.includes('/operator/airalo')).toBe(true)
    expect(body.includes('Sitemap')).toBe(false)
  })

  it('GET / auto switches to English by browser language', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/', {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' }
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('Find and compare eSIM plans by country')).toBe(true)
    expect(body.includes('Quick Search')).toBe(true)
  })

  it('GET / auto switches to Chinese by browser language', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/', {
      headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('按国家查找并对比 eSIM 套餐')).toBe(true)
    expect(body.includes('快速搜索')).toBe(true)
  })

  it('GET /set-language sets cookie and redirects', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/set-language?lang=zh&redirect=%2Fposts', {
      redirect: 'manual'
    })
    expect(res.status).toBe(200)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie.includes('site_lang=zh')).toBe(true)
    const body = await res.text()
    expect(body.includes('/posts')).toBe(true)
  })

  it('GET / respects manual language cookie', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/', {
      headers: { Cookie: 'site_lang=en' }
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('Find and compare eSIM plans by country')).toBe(true)
    expect(body.includes('按国家查找并对比 eSIM 套餐')).toBe(false)
  })

  it('GET /post/:slug returns html', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/post/activate-esim')
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('How to activate eSIM')).toBe(true)
    expect(body.includes('<p>Install via QR code.</p>')).toBe(true)
    expect(body.includes('Activation Guides')).toBe(true)
  })

  it('GET /posts follows global language state', async () => {
    const zhRes = await mf.dispatchFetch('http://localhost:8787/posts', {
      headers: { Cookie: 'site_lang=zh' }
    })
    expect(zhRes.status).toBe(200)
    const zhBody = await zhRes.text()
    expect(zhBody.includes('eSIM 安装教程')).toBe(true)
    expect(zhBody.includes('How to activate eSIM')).toBe(false)
    expect(zhBody.includes('语言筛选')).toBe(false)

    const enRes = await mf.dispatchFetch('http://localhost:8787/posts', {
      headers: { Cookie: 'site_lang=en' }
    })
    expect(enRes.status).toBe(200)
    const enBody = await enRes.text()
    expect(enBody.includes('How to activate eSIM')).toBe(true)
    expect(enBody.includes('eSIM 安装教程')).toBe(false)
  })

  it('GET /posts shows article types and published posts', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/posts', {
      headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('文章类型')).toBe(true)
    expect(body.includes('已发布 SIM卡资讯')).toBe(true)
    expect(body.includes('Activation Guides')).toBe(true)
  })

  it('GET /admin shows site statistics', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/admin', {
      headers: { Cookie: adminCookieHeader, 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('站点收录与发布概览')).toBe(true)
    expect(body.includes('文章语言分布')).toBe(true)
    expect(body.includes('English 1')).toBe(true)
    expect(body.includes('中文 1')).toBe(true)
  })

  it('GET /posts/category/:slug returns category page', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/posts/category/activation-guides')
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body.includes('Activation Guides')).toBe(true)
    expect(body.includes('/post/activate-esim')).toBe(true)
  })

  it('GET /search finds countries and operators without requiring products', async () => {
    const operatorRes = await mf.dispatchFetch('http://localhost:8787/search?q=airalo', {
      headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    expect(operatorRes.status).toBe(200)
    const operatorBody = await operatorRes.text()
    expect(operatorBody.includes('供应商结果')).toBe(true)
    expect(operatorBody.includes('/operator/airalo')).toBe(true)

    const countryRes = await mf.dispatchFetch('http://localhost:8787/search?q=japan', {
      headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
    })
    expect(countryRes.status).toBe(200)
    const countryBody = await countryRes.text()
    expect(countryBody.includes('国家结果')).toBe(true)
    expect(countryBody.includes('/country/japan')).toBe(true)
  })

  it('GET /sitemap.xml includes post urls', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/sitemap.xml')
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml.includes('/post/activate-esim')).toBe(true)
    expect(xml.includes('/posts')).toBe(true)
    expect(xml.includes('/posts/category/activation-guides')).toBe(true)
  })

  it('GET /api/admin/export works with access token', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/api/admin/export?entity=countries&format=json', {
      headers: { Cookie: adminCookieHeader }
    })
    expect(res.status).toBe(200)
    const ct = res.headers.get('content-type') ?? ''
    expect(ct.includes('application/json')).toBe(true)
    const data = (await res.json()) as any[]
    expect(data.some((r) => r && r.slug === 'japan')).toBe(true)
  })

  it('POST /api/admin/import upserts data', async () => {
    const res = await mf.dispatchFetch('http://localhost:8787/api/admin/import', {
      method: 'POST',
      headers: { Cookie: adminCookieHeader, 'Content-Type': 'application/json' },
      redirect: 'manual',
      body: JSON.stringify({
        entity: 'countries',
        format: 'json',
        rows: [
          {
            iso2: 'us',
            name: 'United States',
            slug: 'united-states',
            status: 'draft'
          }
        ]
      })
    })
    expect([200, 302, 303]).toContain(res.status)
    const exp = await mf.dispatchFetch('http://localhost:8787/api/admin/export?entity=countries&format=json', {
      headers: { Cookie: adminCookieHeader }
    })
    const rows = (await exp.json()) as any[]
    expect(rows.some((r) => r && r.slug === 'united-states')).toBe(true)
  })
})

function b64urlFromBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return new Uint8Array(sig)
}

async function makeAccessToken(secret: string, issuer: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: issuer,
    sub: 'admin-test',
    iat: now,
    exp: now + 3600,
    typ: 'access',
    role: 'admin'
  }
  const p1 = b64urlFromBytes(new TextEncoder().encode(JSON.stringify(header)))
  const p2 = b64urlFromBytes(new TextEncoder().encode(JSON.stringify(payload)))
  const data = `${p1}.${p2}`
  const sigBytes = await hmacSha256(secret, data)
  const sig = b64urlFromBytes(sigBytes)
  return `${data}.${sig}`
}

