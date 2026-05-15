import type { Bindings } from '../env'
import { and, asc, desc, eq, like, ne, or, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { requireAdmin } from '../lib/auth'
import { getDb } from '../lib/db'
import { html, redirect, badRequest, unauthorized } from '../lib/http'
import { nowIso, ulid } from '../lib/ids'
import { escapeHtml } from '../lib/seo'
import { criticalCss, layout } from '../lib/templates'
import { mediaUrl, putObject } from '../lib/media'
import { pick, resolveLocale, type SiteLocale } from '../lib/i18n'
import { getSiteSettings, resolveSiteFaviconUrl, resolveSiteLogoUrl, resolveSiteTagline, resolveSiteTitle } from '../lib/site-settings'

type CountryRow = {
  id: string
  iso2: string
  name: string
  name_zh: string | null
  name_en: string | null
  slug: string
  hero_image_key: string | null
  seo_title: string | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  content_html: string | null
  content_html_zh: string | null
  content_html_en: string | null
  faq_json: string | null
  status: string
  publish_at: string | null
}

type OperatorRow = {
  id: string
  name: string
  name_zh: string | null
  name_en: string | null
  slug: string
  website_url: string
  logo_image_key: string | null
  seo_title: string | null
  seo_title_zh: string | null
  seo_title_en: string | null
  seo_description: string | null
  seo_description_zh: string | null
  seo_description_en: string | null
  content_html: string | null
  content_html_zh: string | null
  content_html_en: string | null
  faq_json: string | null
  status: string
  publish_at: string | null
}

type ProductRow = {
  id: string
  operator_id: string
  name: string
  name_zh: string | null
  name_en: string | null
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
  activation_guide_html_zh: string | null
  activation_guide_html_en: string | null
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

const countryRowSelection = {
  id: schema.countries.id,
  iso2: schema.countries.iso2,
  name: schema.countries.name,
  name_zh: schema.countries.nameZh,
  name_en: schema.countries.nameEn,
  slug: schema.countries.slug,
  hero_image_key: schema.countries.heroImageKey,
  seo_title: schema.countries.seoTitle,
  seo_title_zh: schema.countries.seoTitleZh,
  seo_title_en: schema.countries.seoTitleEn,
  seo_description: schema.countries.seoDescription,
  seo_description_zh: schema.countries.seoDescriptionZh,
  seo_description_en: schema.countries.seoDescriptionEn,
  content_html: schema.countries.contentHtml,
  content_html_zh: schema.countries.contentHtmlZh,
  content_html_en: schema.countries.contentHtmlEn,
  faq_json: schema.countries.faqJson,
  status: schema.countries.status,
  publish_at: schema.countries.publishAt
}

const operatorRowSelection = {
  id: schema.operators.id,
  name: schema.operators.name,
  name_zh: schema.operators.nameZh,
  name_en: schema.operators.nameEn,
  slug: schema.operators.slug,
  website_url: schema.operators.websiteUrl,
  logo_image_key: schema.operators.logoImageKey,
  seo_title: schema.operators.seoTitle,
  seo_title_zh: schema.operators.seoTitleZh,
  seo_title_en: schema.operators.seoTitleEn,
  seo_description: schema.operators.seoDescription,
  seo_description_zh: schema.operators.seoDescriptionZh,
  seo_description_en: schema.operators.seoDescriptionEn,
  content_html: schema.operators.contentHtml,
  content_html_zh: schema.operators.contentHtmlZh,
  content_html_en: schema.operators.contentHtmlEn,
  faq_json: schema.operators.faqJson,
  status: schema.operators.status,
  publish_at: schema.operators.publishAt
}

const productRowSelection = {
  id: schema.products.id,
  operator_id: schema.products.operatorId,
  name: schema.products.name,
  name_zh: schema.products.nameZh,
  name_en: schema.products.nameEn,
  slug: schema.products.slug,
  country_iso2: schema.products.countryIso2,
  days: schema.products.days,
  data_gb: schema.products.dataGb,
  is_unlimited: schema.products.isUnlimited,
  supports_hotspot: schema.products.supportsHotspot,
  network_type: schema.products.networkType,
  price_amount: schema.products.priceAmount,
  price_currency: schema.products.priceCurrency,
  purchase_url: schema.products.purchaseUrl,
  activation_guide_html: schema.products.activationGuideHtml,
  activation_guide_html_zh: schema.products.activationGuideHtmlZh,
  activation_guide_html_en: schema.products.activationGuideHtmlEn,
  status: schema.products.status,
  publish_at: schema.products.publishAt
}

const postRowSelection = {
  id: schema.posts.id,
  category_id: schema.posts.categoryId,
  post_type: schema.posts.postType,
  ref_slug: schema.posts.refSlug,
  title: schema.posts.title,
  slug: schema.posts.slug,
  excerpt: schema.posts.excerpt,
  content_html: schema.posts.contentHtml,
  cover_image_key: schema.posts.coverImageKey,
  locale: schema.posts.locale,
  status: schema.posts.status,
  publish_at: schema.posts.publishAt
}

type SiteSettingsRow = {
  site_title: string | null
  site_title_zh: string | null
  site_title_en: string | null
  site_keywords: string | null
  site_keywords_zh: string | null
  site_keywords_en: string | null
  tagline: string | null
  tagline_zh: string | null
  tagline_en: string | null
  logo_image_key: string | null
  favicon_image_key: string | null
}

function adminNav(env: Bindings, req: Request, locale: SiteLocale): string {
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
        <a class="nav-link" href="/admin">${escapeHtml('概览')}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml('国家')}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml('供应商')}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml('套餐')}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml('文章')}</a>
        <a class="nav-link" href="/admin/settings">${escapeHtml('网站设置')}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml('媒体')}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml('导入/导出')}</a>
      </div>
      <div class="nav-actions">
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
  const db = getDb(env.DB)
  const lookup = {
    categories: { table: schema.categories, id: schema.categories.id, slug: schema.categories.slug },
    countries: { table: schema.countries, id: schema.countries.id, slug: schema.countries.slug },
    operators: { table: schema.operators, id: schema.operators.id, slug: schema.operators.slug },
    products: { table: schema.products, id: schema.products.id, slug: schema.products.slug }
  } as const
  const target = lookup[table as keyof typeof lookup]
  if (!target) throw new Error(`Unsupported table: ${table}`)
  const row = await db
    .select({ id: target.id })
    .from(target.table)
    .where(and(eq(target.slug, slug), ne(target.id, entityId)))
    .limit(1)
    .get()
  if (row) throw new Error('Slug already exists')
}

async function ensureUniquePostSlug(env: Bindings, slug: string, locale: string, entityId: string): Promise<void> {
  const db = getDb(env.DB)
  const row = await db
    .select({ id: schema.posts.id })
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), like(schema.posts.locale, `${locale.toLowerCase()}%`), ne(schema.posts.id, entityId)))
    .limit(1)
    .get()
  if (row) throw new Error(`Slug already exists for ${locale}`)
}

async function ensureUniqueCountryIso2(env: Bindings, iso2: string, entityId: string): Promise<void> {
  const db = getDb(env.DB)
  const row = await db
    .select({ id: schema.countries.id })
    .from(schema.countries)
    .where(and(eq(schema.countries.iso2, iso2), ne(schema.countries.id, entityId)))
    .limit(1)
    .get()
  if (row) throw new Error('ISO2 already exists')
}

async function ensureR2KeyExists(env: Bindings, key: string): Promise<void> {
  const head = await env.R2.head(key)
  if (!head) throw new Error('R2 object not found')
}

function ensureJson(value: string, message: string): void {
  if (!value.trim()) return
  JSON.parse(value)
}

async function writeAudit(env: Bindings, actorUserId: string, action: string, entityType: string, entityId: string, detail: unknown): Promise<void> {
  const db = getDb(env.DB)
  await db.insert(schema.auditLogs).values({
    id: ulid(),
    actorUserId,
    action,
    entityType,
    entityId,
    detailJson: JSON.stringify(detail ?? null),
    createdAt: nowIso()
  })
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

function editorBlock(field: string, label: string, value: string, options?: { enableImageUpload?: boolean }): string {
  const id = `f_${field}`
  const editorId = `e_${field}`
  const toolbarId = `t_${field}`
  const statusId = `s_${field}`
  const modalId = `m_${field}`
  const tabsId = `img_tabs_${field}`
  const externalPanelId = `img_external_${field}`
  const uploadPanelId = `img_upload_${field}`
  const urlId = `img_url_${field}`
  const altId = `img_alt_${field}`
  const sizeId = `img_size_${field}`
  const alignId = `img_align_${field}`
  const insertId = `img_insert_${field}`
  const uploadPickerId = `img_upload_picker_${field}`
  const uploadButtonId = `img_upload_btn_${field}`
  const closeId = `img_close_${field}`
  const enableImageUpload = options?.enableImageUpload === true
  return `
    <label><small>${escapeHtml(label)}</small></label>
    <div id="${escapeHtml(toolbarId)}" class="toolbar">
      <button class="btn" type="button" data-cmd="bold">B</button>
      <button class="btn" type="button" data-cmd="italic">I</button>
      <button class="btn" type="button" data-cmd="insertUnorderedList">• List</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h2">H2</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h3">H3</button>
      <button class="btn" type="button" data-cmd="createLink">Link</button>
      <button class="btn" type="button" data-open-image-dialog="1">Image</button>
    </div>
    <div id="${escapeHtml(modalId)}" class="editor-modal" hidden>
      <div class="editor-modal__backdrop" data-close-modal="1"></div>
      <div class="editor-modal__panel card" role="dialog" aria-modal="true" aria-label="插入图片">
        <div class="editor-modal__header">
          <h3>插入图片</h3>
          <button id="${escapeHtml(closeId)}" class="btn" type="button">关闭</button>
        </div>
        <div class="editor-modal__body">
          <div id="${escapeHtml(tabsId)}" class="editor-tabs" role="tablist" aria-label="图片来源">
            <button class="btn primary" type="button" data-tab="external" role="tab" aria-selected="true">外链图片</button>
            ${enableImageUpload ? `<button class="btn" type="button" data-tab="upload" role="tab" aria-selected="false">上传到 R2</button>` : ''}
          </div>
          <div id="${escapeHtml(externalPanelId)}" class="editor-tab-panel">
            <label><small>外部图片链接</small><input id="${escapeHtml(urlId)}" class="input" placeholder="https://example.com/image.jpg"></label>
            <div class="action-row">
              <button id="${escapeHtml(insertId)}" class="btn primary" type="button">插入外链图片</button>
            </div>
          </div>
          ${enableImageUpload ? `<div id="${escapeHtml(uploadPanelId)}" class="editor-tab-panel" hidden>
            <label><small>上传本地图片</small><input id="${escapeHtml(uploadPickerId)}" class="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
            <div class="action-row">
              <button id="${escapeHtml(uploadButtonId)}" class="btn primary" type="button">上传图片到 R2 并插入</button>
            </div>
          </div>` : ''}
          <label><small>图片 Alt 文本</small><input id="${escapeHtml(altId)}" class="input" placeholder="请输入图片说明，便于无障碍和 SEO"></label>
          <div class="split-grid">
            <label><small>插入尺寸</small>
              <select id="${escapeHtml(sizeId)}" class="input">
                <option value="auto">原始尺寸</option>
                <option value="480">中等宽度（480px）</option>
                <option value="720" selected>内容宽度（720px）</option>
                <option value="100%">全宽显示（100%）</option>
              </select>
            </label>
            <label><small>对齐方式</small>
              <select id="${escapeHtml(alignId)}" class="input">
                <option value="left">靠左</option>
                <option value="center" selected>居中</option>
                <option value="right">靠右</option>
              </select>
            </label>
          </div>
          <p id="${escapeHtml(statusId)}"><small>${escapeHtml(enableImageUpload ? '支持外链插图，也支持上传图片到 Cloudflare R2 后插入正文。' : '请输入外部图片链接后插入正文。')}</small></p>
        </div>
      </div>
    </div>
    <div id="${escapeHtml(editorId)}" contenteditable="true" class="input" style="min-height:220px;white-space:normal"></div>
    <textarea id="${escapeHtml(id)}" class="input" name="${escapeHtml(field)}" style="display:none" rows="10">${escapeHtml(value)}</textarea>
    <script>
      (() => {
        const editor = document.getElementById(${JSON.stringify(editorId)})
        const textarea = document.getElementById(${JSON.stringify(id)})
        const toolbar = document.getElementById(${JSON.stringify(toolbarId)})
        const status = document.getElementById(${JSON.stringify(statusId)})
        const modal = document.getElementById(${JSON.stringify(modalId)})
        const tabs = document.getElementById(${JSON.stringify(tabsId)})
        const externalPanel = document.getElementById(${JSON.stringify(externalPanelId)})
        const uploadPanel = document.getElementById(${JSON.stringify(uploadPanelId)})
        const imageUrlInput = document.getElementById(${JSON.stringify(urlId)})
        const imageAltInput = document.getElementById(${JSON.stringify(altId)})
        const imageSizeInput = document.getElementById(${JSON.stringify(sizeId)})
        const imageAlignInput = document.getElementById(${JSON.stringify(alignId)})
        const insertButton = document.getElementById(${JSON.stringify(insertId)})
        const uploadPicker = document.getElementById(${JSON.stringify(uploadPickerId)})
        const uploadButton = document.getElementById(${JSON.stringify(uploadButtonId)})
        const closeButton = document.getElementById(${JSON.stringify(closeId)})
        if (!(editor && textarea && toolbar)) return
        editor.innerHTML = textarea.value || ''
        const sync = () => { textarea.value = editor.innerHTML }
        let savedRange = null
        let currentTab = 'external'
        const saveSelection = () => {
          const sel = window.getSelection()
          if (!sel || sel.rangeCount === 0) return
          const range = sel.getRangeAt(0)
          if (!editor.contains(range.commonAncestorContainer)) return
          savedRange = range.cloneRange()
        }
        const restoreSelection = () => {
          const sel = window.getSelection()
          if (!sel || !savedRange) return
          sel.removeAllRanges()
          sel.addRange(savedRange)
        }
        const moveCaretToEnd = () => {
          const sel = window.getSelection()
          if (!sel) return
          const range = document.createRange()
          range.selectNodeContents(editor)
          range.collapse(false)
          sel.removeAllRanges()
          sel.addRange(range)
          savedRange = range.cloneRange()
        }
        const openModal = () => {
          if (!(modal instanceof HTMLElement)) return
          modal.hidden = false
          document.body.style.overflow = 'hidden'
          switchTab('external')
        }
        const closeModal = () => {
          if (!(modal instanceof HTMLElement)) return
          modal.hidden = true
          document.body.style.overflow = ''
          editor.focus()
          restoreSelection()
        }
        const setStatus = (message, isError) => {
          if (!(status instanceof HTMLElement)) return
          status.innerHTML = '<small' + (isError ? ' style="color:#8e3f34"' : ' class="hint-success"') + '>' + message + '</small>'
        }
        const setPanelEnabled = (panel, enabled) => {
          if (!(panel instanceof HTMLElement)) return
          const fields = panel.querySelectorAll('input, button, select, textarea')
          fields.forEach((field) => {
            if (field instanceof HTMLInputElement || field instanceof HTMLButtonElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
              field.disabled = !enabled
            }
          })
        }
        const switchTab = (tab) => {
          currentTab = tab === 'upload' ? 'upload' : 'external'
          if (externalPanel instanceof HTMLElement) externalPanel.hidden = tab !== 'external'
          if (uploadPanel instanceof HTMLElement) uploadPanel.hidden = tab !== 'upload'
          setPanelEnabled(externalPanel, currentTab === 'external')
          setPanelEnabled(uploadPanel, currentTab === 'upload')
          if (tabs instanceof HTMLElement) {
            const buttons = tabs.querySelectorAll('button[data-tab]')
            buttons.forEach((button) => {
              if (!(button instanceof HTMLButtonElement)) return
              const active = button.getAttribute('data-tab') === currentTab
              button.classList.toggle('primary', active)
              button.setAttribute('aria-selected', active ? 'true' : 'false')
            })
          }
          if (currentTab === 'upload') {
            if (imageUrlInput instanceof HTMLInputElement) imageUrlInput.value = ''
            if (uploadPicker instanceof HTMLInputElement) window.setTimeout(() => uploadPicker.focus(), 0)
            setStatus('上传图片后会按当前尺寸和对齐方式插入正文。', false)
            return
          }
          if (uploadPicker instanceof HTMLInputElement) uploadPicker.value = ''
          if (imageUrlInput instanceof HTMLInputElement) window.setTimeout(() => imageUrlInput.focus(), 0)
          setStatus(${JSON.stringify(enableImageUpload ? '支持外链插图，也支持上传图片到 Cloudflare R2 后插入正文。' : '请输入外部图片链接后插入正文。')}, false)
        }
        const escapeAttr = (value) => String(value)
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        const getImageStyle = () => {
          const size = imageSizeInput instanceof HTMLSelectElement ? imageSizeInput.value : '720'
          if (size === 'auto') return 'max-width:100%;height:auto;'
          if (size === '100%') return 'width:100%;height:auto;'
          return 'width:min(100%,' + size + 'px);height:auto;'
        }
        const getImageAlignmentStyle = () => {
          const align = imageAlignInput instanceof HTMLSelectElement ? imageAlignInput.value : 'center'
          if (align === 'left') return 'display:block;margin:0 auto 0 0;'
          if (align === 'right') return 'display:block;margin:0 0 0 auto;'
          return 'display:block;margin:0 auto;'
        }
        const buildImageHtml = (url) => {
          const alt = imageAltInput instanceof HTMLInputElement ? imageAltInput.value.trim() : ''
          const style = getImageStyle() + getImageAlignmentStyle()
          return '<img src="' + escapeAttr(url) + '" alt="' + escapeAttr(alt) + '" style="' + escapeAttr(style) + '">'
        }
        const insertHtmlAtCursor = (html) => {
          editor.focus()
          restoreSelection()
          const sel = window.getSelection()
          let range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
          if (!range || !editor.contains(range.commonAncestorContainer)) {
            moveCaretToEnd()
            const currentSel = window.getSelection()
            range = currentSel && currentSel.rangeCount > 0 ? currentSel.getRangeAt(0) : null
          }
          if (!range) {
            editor.insertAdjacentHTML('beforeend', html)
            sync()
            moveCaretToEnd()
            return
          }
          range.deleteContents()
          const wrapper = document.createElement('div')
          wrapper.innerHTML = html
          const fragment = document.createDocumentFragment()
          let lastNode = null
          while (wrapper.firstChild) {
            lastNode = fragment.appendChild(wrapper.firstChild)
          }
          range.insertNode(fragment)
          if (lastNode) {
            range = document.createRange()
            range.setStartAfter(lastNode)
            range.collapse(true)
            if (sel) {
              sel.removeAllRanges()
              sel.addRange(range)
            }
            savedRange = range.cloneRange()
          }
          sync()
        }
        const insertImageByUrl = (url) => {
          if (!url) {
            setStatus('请输入图片链接。', true)
            return
          }
          try {
            const parsed = new URL(url, window.location.origin)
            if (!/^https?:$/i.test(parsed.protocol)) {
              setStatus('图片链接只支持 http 或 https。', true)
              return
            }
            insertHtmlAtCursor(buildImageHtml(parsed.toString()))
          } catch {
            setStatus('请输入有效的图片链接。', true)
            return
          }
          setStatus('图片已插入正文。', false)
          closeModal()
        }
        const uploadAndInsertImage = async () => {
          if (!(uploadPicker instanceof HTMLInputElement)) return
          const file = uploadPicker.files && uploadPicker.files[0]
          if (!file) {
            setStatus('请先选择要上传的图片。', true)
            return
          }
          setStatus('正在上传图片到 R2...', false)
          const formData = new FormData()
          formData.append('file', file)
          try {
            const res = await fetch('/api/admin/media/upload', {
              method: 'POST',
              credentials: 'same-origin',
              body: formData
            })
            const data = await res.json().catch(() => null)
            if (!res.ok || !data || !data.url) {
              throw new Error((data && data.error) || '上传失败')
            }
            insertHtmlAtCursor(buildImageHtml(data.url))
            setStatus('图片已上传并插入正文。', false)
            closeModal()
          } catch (error) {
            setStatus((error && error.message) ? error.message : '上传失败，请重试。', true)
          } finally {
            uploadPicker.value = ''
          }
        }
        editor.addEventListener('input', sync)
        editor.addEventListener('mouseup', saveSelection)
        editor.addEventListener('keyup', saveSelection)
        editor.addEventListener('blur', saveSelection)
        toolbar.addEventListener('click', (e) => {
          const t = e.target
          if (!(t instanceof HTMLElement)) return
          const button = t.closest('button')
          if (!(button instanceof HTMLButtonElement)) return
          if (button.hasAttribute('data-open-image-dialog')) {
            e.preventDefault()
            saveSelection()
            openModal()
            return
          }
          const cmd = button.getAttribute('data-cmd')
          if (!cmd) return
          e.preventDefault()
          editor.focus()
          restoreSelection()
          if (cmd === 'createLink') {
            const url = prompt('URL')
            if (!url) return
            document.execCommand('createLink', false, url)
            sync();
            return
          }
          const arg = button.getAttribute('data-arg')
          document.execCommand(cmd, false, arg)
          sync()
        })
        if (insertButton instanceof HTMLButtonElement) {
          insertButton.addEventListener('click', () => {
            const url = imageUrlInput instanceof HTMLInputElement ? imageUrlInput.value.trim() : ''
            insertImageByUrl(url)
          })
        }
        if (uploadButton instanceof HTMLButtonElement) {
          uploadButton.addEventListener('click', () => {
            uploadAndInsertImage()
          })
        }
        if (tabs instanceof HTMLElement) {
          tabs.addEventListener('click', (event) => {
            const target = event.target
            if (!(target instanceof HTMLElement)) return
            const button = target.closest('button[data-tab]')
            if (!(button instanceof HTMLButtonElement)) return
            event.preventDefault()
            switchTab(button.getAttribute('data-tab') || 'external')
          })
        }
        if (imageUrlInput instanceof HTMLInputElement) {
          imageUrlInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              insertImageByUrl(imageUrlInput.value.trim())
            }
          })
        }
        if (uploadPicker instanceof HTMLInputElement) {
          uploadPicker.addEventListener('change', () => {
            if (!(uploadPicker.files && uploadPicker.files[0])) {
              setStatus('请先选择要上传的图片。', true)
              return
            }
            setStatus('已选择图片，点击“上传图片到 R2 并插入”开始上传。', false)
          })
        }
        if (closeButton instanceof HTMLButtonElement) {
          closeButton.addEventListener('click', () => {
            closeModal()
          })
        }
        if (modal instanceof HTMLElement) {
          modal.addEventListener('click', (event) => {
            const target = event.target
            if (!(target instanceof HTMLElement)) return
            if (target.hasAttribute('data-close-modal')) closeModal()
          })
        }
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && modal instanceof HTMLElement && !modal.hidden) {
            closeModal()
          }
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

function twoLocaleFields(
  zhTitle: string,
  zhBody: string,
  enTitle: string,
  enBody: string,
  options?: { compact?: boolean }
): string {
  const sectionClass = options?.compact ? 'split-grid bilingual-grid' : 'split-grid'
  return `<div class="${sectionClass}">
    <section class="card">
      <h2>${escapeHtml(zhTitle)}</h2>
      ${zhBody}
    </section>
    <section class="card">
      <h2>${escapeHtml(enTitle)}</h2>
      ${enBody}
    </section>
  </div>`
}

function resolveLocaleText(locale: SiteLocale, zh: string | null | undefined, en: string | null | undefined, fallback = ''): string {
  const primary = locale === 'zh' ? zh : en
  const secondary = locale === 'zh' ? en : zh
  return (primary ?? '').trim() || (secondary ?? '').trim() || fallback
}

export async function adminSiteSettingsPage(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const locale = resolveLocale(req)
  const canonical = new URL('/admin/settings', env.APP_ORIGIN).toString()
  const url = new URL(req.url)
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const settings = await getSiteSettings(env)
  const title = resolveSiteTitle(env, settings, locale)
  const tagline = resolveSiteTagline(settings, locale, '内容发布与素材管理后台')
  const logoUrl = resolveSiteLogoUrl(env, settings)
  const faviconUrl = resolveSiteFaviconUrl(env, settings)
  const body = `
  ${adminNav(env, req, locale)}
  <main>
    <h1>网站设置</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>网站设置已更新${uploaded === 'logo' ? '，站点 Logo 已同步上传。' : uploaded === 'favicon' ? '，地址栏图标已同步上传。' : uploaded === 'both' ? '，Logo 与地址栏图标已同步上传。' : '。'}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card muted-panel">
      <div class="admin-actions">
        <a class="btn" href="/admin">返回概览</a>
        <a class="btn" href="/" target="_blank" rel="noopener">预览前台</a>
      </div>
    </section>
    <section class="card">
      <form method="POST" action="/admin/settings" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>网站标题（中文）</small><input class="input" name="site_title_zh" value="${escapeHtml(settings.siteTitleZh)}" required></label>
          <label><small>网站标题（English）</small><input class="input" name="site_title_en" value="${escapeHtml(settings.siteTitleEn)}" required></label>
          <label><small>网站 Tagline（中文）</small><input class="input" name="tagline_zh" value="${escapeHtml(settings.taglineZh)}" placeholder="全球旅行上网指南"></label>
          <label><small>网站 Tagline（English）</small><input class="input" name="tagline_en" value="${escapeHtml(settings.taglineEn)}" placeholder="Global travel connectivity guide"></label>
          <label><small>网站主题词（中文）</small><input class="input" name="site_keywords_zh" value="${escapeHtml(settings.siteKeywordsZh)}" placeholder="eSIM, 境外流量, 旅行上网"></label>
          <label><small>网站主题词（English）</small><input class="input" name="site_keywords_en" value="${escapeHtml(settings.siteKeywordsEn)}" placeholder="eSIM, travel, data plan"></label>
          <label><small>站点域名</small><input class="input" value="${escapeHtml(env.APP_ORIGIN)}" disabled></label>
        </div>
        <div style="height:12px"></div>
        <input type="hidden" name="current_logo_image_key" value="${escapeHtml(settings.logoImageKey ?? '')}">
        <label><small>网站 Logo 上传到 R2</small><input class="input" type="file" name="logo_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${settings.logoImageKey ? `<div style="height:8px"></div><p><small>当前 Logo R2 key：</small> <code>${escapeHtml(settings.logoImageKey)}</code></p>` : '<p><small>未上传 Logo，保存时如选择图片将自动上传到 R2。</small></p>'}
        <div style="height:8px"></div>
        <img id="site-logo-preview" src="${escapeHtml(logoUrl ?? '')}" alt="${escapeHtml(title)} logo" width="160" height="160" loading="lazy" style="width:160px;height:160px;border-radius:16px;border:1px solid var(--b);object-fit:cover;${logoUrl ? '' : 'display:none;'}" />
        <div style="height:16px"></div>
        <input type="hidden" name="current_favicon_image_key" value="${escapeHtml(settings.faviconImageKey ?? '')}">
        <label><small>网站地址栏图标上传到 R2</small><input class="input" type="file" name="favicon_file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"></label>
        ${settings.faviconImageKey ? `<div style="height:8px"></div><p><small>当前 favicon R2 key：</small> <code>${escapeHtml(settings.faviconImageKey)}</code></p>` : '<p><small>未上传 favicon，保存时如选择图片将自动上传到 R2。</small></p>'}
        <div style="height:8px"></div>
        <img id="site-favicon-preview" src="${escapeHtml(faviconUrl ?? '')}" alt="${escapeHtml(title)} favicon" width="64" height="64" loading="lazy" style="width:64px;height:64px;border-radius:12px;border:1px solid var(--b);object-fit:cover;${faviconUrl ? '' : 'display:none;'}" />
        <script>
          (() => {
            const bindPreview = (name, previewId) => {
              const input = document.querySelector('input[name="' + name + '"]')
              const preview = document.getElementById(previewId)
              if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
              input.addEventListener('change', () => {
                const file = input.files && input.files[0]
                if (!file) return
                preview.src = URL.createObjectURL(file)
                preview.style.display = 'block'
              })
            }
            bindPreview('logo_file', 'site-logo-preview')
            bindPreview('favicon_file', 'site-favicon-preview')
          })()
        </script>
        <div style="height:16px"></div>
        <section class="card muted-panel">
          <h2>当前站点预览</h2>
          <div class="split-grid">
            <div class="action-row" style="align-items:center">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)} logo" width="56" height="56" style="width:56px;height:56px;border-radius:14px;border:1px solid var(--b);object-fit:cover">` : '<span class="brand-badge">eSIM</span>'}
              <div>
                <strong>${escapeHtml(resolveSiteTitle(env, settings, 'zh'))}</strong>
                <div><small>${escapeHtml(resolveSiteTagline(settings, 'zh', '全球旅行上网指南'))}</small></div>
              </div>
            </div>
            <div class="action-row" style="align-items:center">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)} logo" width="56" height="56" style="width:56px;height:56px;border-radius:14px;border:1px solid var(--b);object-fit:cover">` : '<span class="brand-badge">eSIM</span>'}
              <div>
                <strong>${escapeHtml(resolveSiteTitle(env, settings, 'en'))}</strong>
                <div><small>${escapeHtml(resolveSiteTagline(settings, 'en', 'Global travel connectivity guide'))}</small></div>
              </div>
            </div>
          </div>
        </section>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">保存网站设置</button>
      </form>
    </section>
  </main>
  `
  return html(
    layout({ title: `网站设置 | ${title}`, description: '管理站点标题、关键词、Logo 与 favicon。', canonical, robots: 'noindex, nofollow' }, body, criticalCss()),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function adminSaveSiteSettings(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return redirect('/admin/settings?error=Invalid%20form')
  const siteTitleZh = String(form.get('site_title_zh') ?? '').trim()
  const siteTitleEn = String(form.get('site_title_en') ?? '').trim()
  const siteKeywordsZh = String(form.get('site_keywords_zh') ?? '').trim()
  const siteKeywordsEn = String(form.get('site_keywords_en') ?? '').trim()
  const taglineZh = String(form.get('tagline_zh') ?? '').trim()
  const taglineEn = String(form.get('tagline_en') ?? '').trim()
  const currentLogo = String(form.get('current_logo_image_key') ?? '').trim() || null
  const currentFavicon = String(form.get('current_favicon_image_key') ?? '').trim() || null
  const logoFile = form.get('logo_file')
  const faviconFile = form.get('favicon_file')
  if (!siteTitleZh || !siteTitleEn) return redirect('/admin/settings?error=Missing%20site%20title')

  let logo = currentLogo
  let favicon = currentFavicon
  let uploadedLogo = false
  let uploadedFavicon = false
  try {
    if (logoFile instanceof File && logoFile.size > 0) {
      logo = await uploadImageToR2(env, logoFile, 'site/logo', 'Site logo')
      uploadedLogo = true
    }
    if (faviconFile instanceof File && faviconFile.size > 0) {
      favicon = await uploadSiteIconToR2(env, faviconFile, 'site/favicon', 'Favicon')
      uploadedFavicon = true
    }
    if (logo) await ensureR2KeyExists(env, logo)
    if (favicon) await ensureR2KeyExists(env, favicon)
  } catch (error) {
    return redirect(`/admin/settings?error=${encodeURIComponent((error as Error).message)}`)
  }

  const db = getDb(env.DB)
  await db
    .insert(schema.siteSettings)
    .values({
      id: 'default',
      siteTitle: siteTitleZh || siteTitleEn,
      siteTitleZh,
      siteTitleEn,
      siteKeywords: siteKeywordsZh || siteKeywordsEn || null,
      siteKeywordsZh: siteKeywordsZh || null,
      siteKeywordsEn: siteKeywordsEn || null,
      tagline: taglineZh || taglineEn || null,
      taglineZh: taglineZh || null,
      taglineEn: taglineEn || null,
      logoImageKey: logo,
      faviconImageKey: favicon,
      updatedAt: nowIso()
    })
    .onConflictDoUpdate({
      target: schema.siteSettings.id,
      set: {
        siteTitle: siteTitleZh || siteTitleEn,
        siteTitleZh,
        siteTitleEn,
        siteKeywords: siteKeywordsZh || siteKeywordsEn || null,
        siteKeywordsZh: siteKeywordsZh || null,
        siteKeywordsEn: siteKeywordsEn || null,
        tagline: taglineZh || taglineEn || null,
        taglineZh: taglineZh || null,
        taglineEn: taglineEn || null,
        logoImageKey: logo,
        faviconImageKey: favicon,
        updatedAt: nowIso()
      }
    })

  const uploaded = uploadedLogo && uploadedFavicon ? 'both' : uploadedLogo ? 'logo' : uploadedFavicon ? 'favicon' : ''
  return redirect(`/admin/settings?success=saved${uploaded ? `&uploaded=${uploaded}` : ''}`)
}

export async function adminEditCategoryPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const url = new URL(req.url)
  const isNew = !id
  const db = getDb(env.DB)
  const row = isNew
    ? null
    : await db
        .select({
          id: schema.categories.id,
          parent_id: schema.categories.parentId,
          name: schema.categories.name,
          slug: schema.categories.slug,
          sort_order: schema.categories.sortOrder
        })
        .from(schema.categories)
        .where(eq(schema.categories.id, id!))
        .limit(1)
        .get() as CategoryRow | undefined
  if (!isNew && !row) return redirect('/admin/categories')

  const parents = await db
    .select({ id: schema.categories.id, name: schema.categories.name, slug: schema.categories.slug })
    .from(schema.categories)
    .orderBy(asc(schema.categories.name))
    .limit(1000)
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

  const existing = await getDb(env.DB)
    .select({
      id: schema.categories.id,
      parent_id: schema.categories.parentId,
      name: schema.categories.name,
      slug: schema.categories.slug,
      sort_order: schema.categories.sortOrder
    })
    .from(schema.categories)
    .where(eq(schema.categories.id, entityId))
    .limit(1)
    .get() as CategoryRow | undefined
  if (existing) await writeRevision(env, user.userId, 'categories', entityId, existing)

  try {
    await ensureUniqueSlug(env, 'categories', slug, entityId)
  } catch (e) {
    return redirect(entityEditLocation('categories', id, entityId, (e as Error).message))
  }
  await getDb(env.DB)
    .insert(schema.categories)
    .values({
      id: entityId,
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
  await writeAudit(env, user.userId, id ? 'update' : 'create', 'categories', entityId, { slug })
  return redirect(`/admin/categories/${entityId}?success=saved`)
}

async function writeRevision(env: Bindings, actorUserId: string, entityType: string, entityId: string, snapshot: unknown): Promise<void> {
  const db = getDb(env.DB)
  const row = await db
    .select({ v: sql<number | null>`max(${schema.revisions.version})` })
    .from(schema.revisions)
    .where(and(eq(schema.revisions.entityType, entityType), eq(schema.revisions.entityId, entityId)))
    .get()
  const nextVersion = (row?.v ?? 0) + 1
  await db.insert(schema.revisions).values({
    id: ulid(),
    entityType,
    entityId,
    version: nextVersion,
    snapshotJson: JSON.stringify(snapshot),
    actorUserId,
    createdAt: nowIso()
  })
}

export async function adminEditCountryPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const locale = resolveLocale(req)
  const url = new URL(req.url)
  const isNew = !id
  const db = getDb(env.DB)
  const row = isNew
    ? null
    : await db.select(countryRowSelection).from(schema.countries).where(eq(schema.countries.id, id!)).limit(1).get() as CountryRow | undefined
  if (!isNew && !row) return redirect('/admin/countries')

  const canonical = new URL(isNew ? '/admin/countries/new' : `/admin/countries/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const v = row ?? {
    id: '',
    iso2: '',
    name: '',
    name_zh: '',
    name_en: '',
    slug: '',
    hero_image_key: null,
    seo_title: '',
    seo_title_zh: '',
    seo_title_en: '',
    seo_description: '',
    seo_description_zh: '',
    seo_description_en: '',
    content_html: '',
    content_html_zh: '',
    content_html_en: '',
    faq_json: '[]',
    status: 'draft',
    publish_at: null
  }
  const nameZh = v.name_zh ?? v.name ?? ''
  const nameEn = v.name_en ?? v.name ?? ''
  const seoTitleZh = v.seo_title_zh ?? v.seo_title ?? ''
  const seoTitleEn = v.seo_title_en ?? v.seo_title ?? ''
  const seoDescZh = v.seo_description_zh ?? v.seo_description ?? ''
  const seoDescEn = v.seo_description_en ?? v.seo_description ?? ''
  const contentZh = v.content_html_zh ?? v.content_html ?? ''
  const contentEn = v.content_html_en ?? v.content_html ?? ''
  const body = `
  ${adminNav(env, req, locale)}
  <main>
    <h1>${isNew ? '新增国家' : '编辑国家'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_image' ? '国家信息已保存，头图已上传并绑定到当前记录。' : '国家信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/countries/new' : `/admin/countries/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>ISO2</small><input class="input" name="iso2" value="${escapeHtml(v.iso2)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
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
        <img id="country-hero-preview" src="${escapeHtml(v.hero_image_key ? mediaUrl(env.APP_ORIGIN, v.hero_image_key) : '')}" alt="${escapeHtml(resolveLocaleText(locale, nameZh, nameEn, v.slug))}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.hero_image_key ? '' : 'display:none;'}" />
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
        ${twoLocaleFields(
          '中文内容',
          `
            <label><small>国家名称（中文）</small><input class="input" name="name_zh" value="${escapeHtml(nameZh)}" required></label>
            <div style="height:12px"></div>
            <label><small>SEO 标题（中文）</small><input class="input" name="seo_title_zh" value="${escapeHtml(seoTitleZh)}"></label>
            <div style="height:12px"></div>
            <label><small>SEO 描述（中文）</small><input class="input" name="seo_description_zh" value="${escapeHtml(seoDescZh)}"></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_zh', '国家正文（中文）', contentZh, { enableImageUpload: true })}
          `,
          'English Content',
          `
            <label><small>Country Name (English)</small><input class="input" name="name_en" value="${escapeHtml(nameEn)}" required></label>
            <div style="height:12px"></div>
            <label><small>SEO Title (English)</small><input class="input" name="seo_title_en" value="${escapeHtml(seoTitleEn)}"></label>
            <div style="height:12px"></div>
            <label><small>SEO Description (English)</small><input class="input" name="seo_description_en" value="${escapeHtml(seoDescEn)}"></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_en', 'Country Content (English)', contentEn, { enableImageUpload: true })}
          `
        )}
        <div style="height:12px"></div>
        ${jsonTextarea('faq_json', 'faq_json（当前仍为通用 JSON）', v.faq_json ?? '[]', 6)}
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
  const nameZh = String(form.get('name_zh') ?? '').trim()
  const nameEn = String(form.get('name_en') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAt = String(form.get('publish_at') ?? '').trim() || null
  const currentHero = String(form.get('current_hero_image_key') ?? '').trim() || null
  const heroFile = form.get('hero_file')
  const seoTitleZh = String(form.get('seo_title_zh') ?? '').trim() || null
  const seoTitleEn = String(form.get('seo_title_en') ?? '').trim() || null
  const seoDescZh = String(form.get('seo_description_zh') ?? '').trim() || null
  const seoDescEn = String(form.get('seo_description_en') ?? '').trim() || null
  const contentHtmlZh = sanitizeHtmlBasic(String(form.get('content_html_zh') ?? '').trim()) || null
  const contentHtmlEn = sanitizeHtmlBasic(String(form.get('content_html_en') ?? '').trim()) || null
  const faqJson = String(form.get('faq_json') ?? '').trim() || '[]'
  const db = getDb(env.DB)
  const name = nameZh || nameEn
  const seoTitle = seoTitleZh || seoTitleEn
  const seoDesc = seoDescZh || seoDescEn
  const contentHtml = contentHtmlZh || contentHtmlEn
  if (!iso2 || !nameZh || !nameEn || !slug) return redirect(entityEditLocation('countries', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('countries', id, entityId, 'Invalid slug'))

  const existing = await db.select(countryRowSelection).from(schema.countries).where(eq(schema.countries.id, entityId)).limit(1).get() as CountryRow | undefined
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
  await db
    .insert(schema.countries)
    .values({
      id: entityId,
      iso2,
      name,
      nameZh,
      nameEn,
      slug,
      heroImageKey: hero,
      seoTitle,
      seoTitleZh,
      seoTitleEn,
      seoDescription: seoDesc,
      seoDescriptionZh: seoDescZh,
      seoDescriptionEn: seoDescEn,
      contentHtml,
      contentHtmlZh,
      contentHtmlEn,
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
        name,
        nameZh,
        nameEn,
        slug,
        heroImageKey: hero,
        seoTitle,
        seoTitleZh,
        seoTitleEn,
        seoDescription: seoDesc,
        seoDescriptionZh: seoDescZh,
        seoDescriptionEn: seoDescEn,
        contentHtml,
        contentHtmlZh,
        contentHtmlEn,
        faqJson,
        status,
        publishAt,
        publishedAt: publishedAt ?? sql`${schema.countries.publishedAt}`,
        updatedAt: now
      }
    })

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'countries', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'countries', entityId, { published_at: now })

  return redirect(`/admin/countries/${entityId}?success=${uploadedNewHero ? 'saved_with_image' : 'saved'}${uploadedNewHero ? '&uploaded=1' : ''}`)
}

export async function adminEditOperatorPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const locale = resolveLocale(req)
  const url = new URL(req.url)
  const isNew = !id
  const db = getDb(env.DB)
  const row = isNew
    ? null
    : await db.select(operatorRowSelection).from(schema.operators).where(eq(schema.operators.id, id!)).limit(1).get() as OperatorRow | undefined
  if (!isNew && !row) return redirect('/admin/operators')

  const canonical = new URL(isNew ? '/admin/operators/new' : `/admin/operators/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const v = row ?? {
    id: '',
    name: '',
    name_zh: '',
    name_en: '',
    slug: '',
    website_url: '',
    logo_image_key: null,
    seo_title: '',
    seo_title_zh: '',
    seo_title_en: '',
    seo_description: '',
    seo_description_zh: '',
    seo_description_en: '',
    content_html: '',
    content_html_zh: '',
    content_html_en: '',
    faq_json: '[]',
    status: 'draft',
    publish_at: null
  }
  const nameZh = v.name_zh ?? v.name ?? ''
  const nameEn = v.name_en ?? v.name ?? ''
  const seoTitleZh = v.seo_title_zh ?? v.seo_title ?? ''
  const seoTitleEn = v.seo_title_en ?? v.seo_title ?? ''
  const seoDescZh = v.seo_description_zh ?? v.seo_description ?? ''
  const seoDescEn = v.seo_description_en ?? v.seo_description ?? ''
  const contentZh = v.content_html_zh ?? v.content_html ?? ''
  const contentEn = v.content_html_en ?? v.content_html ?? ''
  const body = `
  ${adminNav(env, req, locale)}
  <main>
    <h1>${isNew ? '新增供应商' : '编辑供应商'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_logo' ? '供应商信息已保存，logo 已上传并绑定到当前记录。' : '供应商信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/operators/new' : `/admin/operators/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
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
        <img id="operator-logo-preview" src="${escapeHtml(v.logo_image_key ? mediaUrl(env.APP_ORIGIN, v.logo_image_key) : '')}" alt="${escapeHtml(resolveLocaleText(locale, nameZh, nameEn, v.slug))} logo" width="96" height="96" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.logo_image_key ? '' : 'display:none;'}" />
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
        ${twoLocaleFields(
          '中文内容',
          `
            <label><small>供应商名称（中文）</small><input class="input" name="name_zh" value="${escapeHtml(nameZh)}" required></label>
            <div style="height:12px"></div>
            <label><small>SEO 标题（中文）</small><input class="input" name="seo_title_zh" value="${escapeHtml(seoTitleZh)}"></label>
            <div style="height:12px"></div>
            <label><small>SEO 描述（中文）</small><input class="input" name="seo_description_zh" value="${escapeHtml(seoDescZh)}"></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_zh', '供应商正文（中文）', contentZh, { enableImageUpload: true })}
          `,
          'English Content',
          `
            <label><small>Operator Name (English)</small><input class="input" name="name_en" value="${escapeHtml(nameEn)}" required></label>
            <div style="height:12px"></div>
            <label><small>SEO Title (English)</small><input class="input" name="seo_title_en" value="${escapeHtml(seoTitleEn)}"></label>
            <div style="height:12px"></div>
            <label><small>SEO Description (English)</small><input class="input" name="seo_description_en" value="${escapeHtml(seoDescEn)}"></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_en', 'Operator Content (English)', contentEn, { enableImageUpload: true })}
          `
        )}
        <div style="height:12px"></div>
        ${jsonTextarea('faq_json', 'faq_json（当前仍为通用 JSON）', v.faq_json ?? '[]', 6)}
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
  const nameZh = String(form.get('name_zh') ?? '').trim()
  const nameEn = String(form.get('name_en') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim()
  const websiteUrl = String(form.get('website_url') ?? '').trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAt = String(form.get('publish_at') ?? '').trim() || null
  const currentLogo = String(form.get('current_logo_image_key') ?? '').trim() || null
  const logoFile = form.get('logo_file')
  const seoTitleZh = String(form.get('seo_title_zh') ?? '').trim() || null
  const seoTitleEn = String(form.get('seo_title_en') ?? '').trim() || null
  const seoDescZh = String(form.get('seo_description_zh') ?? '').trim() || null
  const seoDescEn = String(form.get('seo_description_en') ?? '').trim() || null
  const contentHtmlZh = sanitizeHtmlBasic(String(form.get('content_html_zh') ?? '').trim()) || null
  const contentHtmlEn = sanitizeHtmlBasic(String(form.get('content_html_en') ?? '').trim()) || null
  const faqJson = String(form.get('faq_json') ?? '').trim() || '[]'
  const db = getDb(env.DB)
  const name = nameZh || nameEn
  const seoTitle = seoTitleZh || seoTitleEn
  const seoDesc = seoDescZh || seoDescEn
  const contentHtml = contentHtmlZh || contentHtmlEn
  if (!nameZh || !nameEn || !slug || !websiteUrl) return redirect(operatorEditLocation(id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(operatorEditLocation(id, entityId, 'Invalid slug'))
  if (!isValidUrl(websiteUrl)) return redirect(operatorEditLocation(id, entityId, 'Invalid website_url'))

  const existing = await db.select(operatorRowSelection).from(schema.operators).where(eq(schema.operators.id, entityId)).limit(1).get() as OperatorRow | undefined
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
  await db
    .insert(schema.operators)
    .values({
      id: entityId,
      name,
      nameZh,
      nameEn,
      slug,
      websiteUrl,
      logoImageKey: logo,
      seoTitle,
      seoTitleZh,
      seoTitleEn,
      seoDescription: seoDesc,
      seoDescriptionZh: seoDescZh,
      seoDescriptionEn: seoDescEn,
      contentHtml,
      contentHtmlZh,
      contentHtmlEn,
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
        name,
        nameZh,
        nameEn,
        slug,
        websiteUrl,
        logoImageKey: logo,
        seoTitle,
        seoTitleZh,
        seoTitleEn,
        seoDescription: seoDesc,
        seoDescriptionZh: seoDescZh,
        seoDescriptionEn: seoDescEn,
        contentHtml,
        contentHtmlZh,
        contentHtmlEn,
        faqJson,
        status,
        publishAt,
        publishedAt: publishedAt ?? sql`${schema.operators.publishedAt}`,
        updatedAt: now
      }
    })

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'operators', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'operators', entityId, { published_at: now })

  return redirect(`/admin/operators/${entityId}?success=${uploadedNewLogo ? 'saved_with_logo' : 'saved'}${uploadedNewLogo ? '&uploaded=1' : ''}`)
}

export async function adminEditProductPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const locale = resolveLocale(req)
  const url = new URL(req.url)
  const isNew = !id
  const db = getDb(env.DB)
  const row = isNew
    ? null
    : await db.select(productRowSelection).from(schema.products).where(eq(schema.products.id, id!)).limit(1).get() as ProductRow | undefined
  if (!isNew && !row) return redirect('/admin/products')

  const operators = await db
    .select({ id: schema.operators.id, name: schema.operators.name, slug: schema.operators.slug })
    .from(schema.operators)
    .orderBy(asc(schema.operators.name))
    .limit(500)
  const operatorId = row?.operator_id ?? (operators[0]?.id ?? '')

  const canonical = new URL(isNew ? '/admin/products/new' : `/admin/products/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const v = row ?? {
    id: '',
    operator_id: operatorId,
    name: '',
    name_zh: '',
    name_en: '',
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
    activation_guide_html_zh: '',
    activation_guide_html_en: '',
    status: 'draft',
    publish_at: null
  }
  const nameZh = v.name_zh ?? v.name ?? ''
  const nameEn = v.name_en ?? v.name ?? ''
  const activationZh = v.activation_guide_html_zh ?? v.activation_guide_html ?? ''
  const activationEn = v.activation_guide_html_en ?? v.activation_guide_html ?? ''

  const body = `
  ${adminNav(env, req, locale)}
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
        ${twoLocaleFields(
          '中文内容',
          `
            <label><small>套餐名称（中文）</small><input class="input" name="name_zh" value="${escapeHtml(nameZh)}" required></label>
            <div style="height:12px"></div>
            ${editorBlock('activation_guide_html_zh', '激活教程（中文）', activationZh, { enableImageUpload: true })}
          `,
          'English Content',
          `
            <label><small>Plan Name (English)</small><input class="input" name="name_en" value="${escapeHtml(nameEn)}" required></label>
            <div style="height:12px"></div>
            ${editorBlock('activation_guide_html_en', 'Activation Guide (English)', activationEn, { enableImageUpload: true })}
          `
        )}
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
  const nameZh = String(form.get('name_zh') ?? '').trim()
  const nameEn = String(form.get('name_en') ?? '').trim()
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
  const activationZh = sanitizeHtmlBasic(String(form.get('activation_guide_html_zh') ?? '').trim()) || null
  const activationEn = sanitizeHtmlBasic(String(form.get('activation_guide_html_en') ?? '').trim()) || null
  const db = getDb(env.DB)
  const name = nameZh || nameEn
  const activation = activationZh || activationEn
  if (!operatorId || !nameZh || !nameEn || !slug || !countryIso2 || !purchaseUrl) return redirect(entityEditLocation('products', id, entityId, 'Missing fields'))
  if (!isValidSlug(slug)) return redirect(entityEditLocation('products', id, entityId, 'Invalid slug'))
  if (!isValidUrl(purchaseUrl)) return redirect(entityEditLocation('products', id, entityId, 'Invalid purchase_url'))
  if (!Number.isFinite(days) || days < 1) return redirect(entityEditLocation('products', id, entityId, 'Invalid days'))
  if (!Number.isFinite(priceAmount) || priceAmount < 0) return redirect(entityEditLocation('products', id, entityId, 'Invalid price'))
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(entityEditLocation('products', id, entityId, 'publish_at required for scheduled'))
    await ensureUniqueSlug(env, 'products', slug, entityId)
    if (status === 'published' || status === 'scheduled') {
      const [operatorExists, countryExists] = await Promise.all([
        db.select({ id: schema.operators.id }).from(schema.operators).where(eq(schema.operators.id, operatorId)).limit(1).get(),
        db.select({ iso2: schema.countries.iso2 }).from(schema.countries).where(eq(schema.countries.iso2, countryIso2)).limit(1).get()
      ])
      if (!operatorExists) throw new Error('Invalid operator_id')
      if (!countryExists) throw new Error('Invalid country_iso2')
    }
  } catch (e) {
    return redirect(entityEditLocation('products', id, entityId, (e as Error).message))
  }

  const existing = await db.select(productRowSelection).from(schema.products).where(eq(schema.products.id, entityId)).limit(1).get() as ProductRow | undefined
  if (existing) await writeRevision(env, user.userId, 'products', entityId, existing)

  const publishedAt = toPublishedAt(status, now)
  await db
    .insert(schema.products)
    .values({
      id: entityId,
      operatorId,
      name,
      nameZh,
      nameEn,
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
      activationGuideHtml: activation,
      activationGuideHtmlZh: activationZh,
      activationGuideHtmlEn: activationEn,
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
        name,
        nameZh,
        nameEn,
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
        activationGuideHtml: activation,
        activationGuideHtmlZh: activationZh,
        activationGuideHtmlEn: activationEn,
        status,
        publishAt,
        publishedAt: publishedAt ?? sql`${schema.products.publishedAt}`,
        updatedAt: now
      }
    })

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'products', entityId, { slug, status })
  if (status === 'published') await writeAudit(env, user.userId, 'publish', 'products', entityId, { published_at: now })

  return redirect(`/admin/products/${entityId}?success=saved`)
}

export async function adminEditPostPage(env: Bindings, req: Request, id: string | null): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return redirect('/admin/login')
  const locale = resolveLocale(req)
  const url = new URL(req.url)
  const isNew = !id
  const db = getDb(env.DB)
  const categories = await db
    .select({ id: schema.categories.id, name: schema.categories.name, slug: schema.categories.slug })
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name))
    .limit(1000)
  const row = isNew
    ? null
    : await db.select(postRowSelection).from(schema.posts).where(eq(schema.posts.id, id!)).limit(1).get() as PostRow | undefined
  if (!isNew && !row) return redirect('/admin/posts')
  const pairKey = row ? row.ref_slug ?? row.slug : ''
  const siblings = row
    ? await db
        .select(postRowSelection)
        .from(schema.posts)
        .where(or(eq(schema.posts.id, row.id), eq(schema.posts.refSlug, pairKey), eq(schema.posts.slug, pairKey)))
        .orderBy(desc(schema.posts.updatedAt))
        .limit(4) as PostRow[]
    : []
  const canonical = new URL(isNew ? '/admin/posts/new' : `/admin/posts/${id}`, env.APP_ORIGIN).toString()
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')
  const uploaded = url.searchParams.get('uploaded')
  const shared = row ?? {
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
  const zhPost = siblings.find((item) => item.locale.toLowerCase().startsWith('zh')) ?? (row?.locale.toLowerCase().startsWith('zh') ? row : null) ?? {
    id: '',
    category_id: shared.category_id,
    post_type: shared.post_type,
    ref_slug: pairKey || null,
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    cover_image_key: shared.cover_image_key,
    locale: 'zh',
    status: shared.status,
    publish_at: shared.publish_at
  }
  const enPost = siblings.find((item) => item.locale.toLowerCase().startsWith('en')) ?? (row?.locale.toLowerCase().startsWith('en') ? row : null) ?? {
    id: '',
    category_id: shared.category_id,
    post_type: shared.post_type,
    ref_slug: pairKey || null,
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    cover_image_key: shared.cover_image_key,
    locale: 'en',
    status: shared.status,
    publish_at: shared.publish_at
  }
  const body = `
  ${adminNav(env, req, locale)}
  <main>
    <h1>${isNew ? '新增文章' : '编辑文章'}</h1>
    ${success ? `<section class="card notice success"><strong>保存成功</strong><p>${escapeHtml(success === 'saved_with_image' ? '文章信息已保存，封面图已上传并绑定到当前记录。' : '文章信息已保存。')}</p></section>` : ''}
    ${error ? `<section class="card notice error"><strong>保存失败</strong><p>${escapeHtml(error)}</p></section>` : ''}
    <section class="card muted-panel">
      <div class="admin-actions">
        <a class="btn" href="/admin/posts">返回文章列表</a>
        <a class="btn" href="/admin/categories">管理文章分类</a>
        ${zhPost.slug ? `<a class="btn" href="/post/${escapeHtml(zhPost.slug)}" target="_blank" rel="noopener">预览中文</a>` : ''}
        ${enPost.slug ? `<a class="btn" href="/post/${escapeHtml(enPost.slug)}" target="_blank" rel="noopener">Preview EN</a>` : ''}
      </div>
    </section>
    <section class="card">
      <form method="POST" action="${isNew ? '/admin/posts/new' : `/admin/posts/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <input type="hidden" name="pair_ref_slug" value="${escapeHtml(pairKey)}">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>文章统一 Slug</small><input class="input" name="slug" value="${escapeHtml(zhPost.slug || enPost.slug || shared.slug)}" required></label>
          <label><small>文章分类</small>
            <select class="input" name="category_id">
              <option value="">(未分类)</option>
              ${categories.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === shared.category_id ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.slug)})</option>`).join('')}
            </select>
          </label>
          <label><small>发布状态</small><select class="input" name="status">${statusOptions(shared.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>定时发布时间（ISO8601，可空）</small><input class="input" name="publish_at" value="${escapeHtml(shared.publish_at ?? '')}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_cover_image_key" value="${escapeHtml(shared.cover_image_key ?? '')}">
        <label><small>封面图上传到 R2</small><input class="input" type="file" name="cover_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === '1' ? `<p><small class="hint-success">本次已上传新的封面图。</small></p>` : ''}
        ${shared.cover_image_key ? `<div style="height:8px"></div><p><small>当前 R2 key：</small> <code>${escapeHtml(shared.cover_image_key)}</code></p>` : '<p><small>未上传封面图，保存时如选择图片将自动生成 R2 key。</small></p>'}
        <div style="height:8px"></div>
        <img id="post-cover-preview" src="${escapeHtml(shared.cover_image_key ? mediaUrl(env.APP_ORIGIN, shared.cover_image_key) : '')}" alt="${escapeHtml(resolveLocaleText(locale, zhPost.title, enPost.title, shared.slug))}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${shared.cover_image_key ? '' : 'display:none;'}" />
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
        ${twoLocaleFields(
          '中文文章',
          `
            <label><small>文章标题（中文）</small><input class="input" name="title_zh" value="${escapeHtml(zhPost.title)}" required></label>
            <div style="height:12px"></div>
            <label><small>文章摘要（中文，可空）</small><textarea class="input" name="excerpt_zh" rows="3">${escapeHtml(zhPost.excerpt ?? '')}</textarea></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_zh', '正文内容（中文）', zhPost.content_html ?? '', { enableImageUpload: true })}
          `,
          'English Post',
          `
            <label><small>Title (English)</small><input class="input" name="title_en" value="${escapeHtml(enPost.title)}" required></label>
            <div style="height:12px"></div>
            <label><small>Excerpt (English, optional)</small><textarea class="input" name="excerpt_en" rows="3">${escapeHtml(enPost.excerpt ?? '')}</textarea></label>
            <div style="height:12px"></div>
            ${editorBlock('content_html_en', 'Content (English)', enPost.content_html ?? '', { enableImageUpload: true })}
          `
        )}
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
  const now = nowIso()

  const categoryId = String(form.get('category_id') ?? '').trim() || null
  const pairRefSlug = String(form.get('pair_ref_slug') ?? '').trim()
  const sharedSlug = String(form.get('slug') ?? '').trim()
  const status = String(form.get('status') ?? 'draft').trim()
  const publishAtRaw = String(form.get('publish_at') ?? '').trim() || null
  const currentCover = String(form.get('current_cover_image_key') ?? '').trim() || null
  const coverFile = form.get('cover_file')
  const titleZh = String(form.get('title_zh') ?? '').trim()
  const excerptZh = String(form.get('excerpt_zh') ?? '').trim() || null
  const contentZh = sanitizeHtmlBasic(String(form.get('content_html_zh') ?? '').trim())
  const titleEn = String(form.get('title_en') ?? '').trim()
  const excerptEn = String(form.get('excerpt_en') ?? '').trim() || null
  const contentEn = sanitizeHtmlBasic(String(form.get('content_html_en') ?? '').trim())
  const fallbackEntityId = id ?? ulid()
  const db = getDb(env.DB)
  if (!titleZh || !sharedSlug || !contentZh || !titleEn || !contentEn) return redirect(entityEditLocation('posts', id, fallbackEntityId, 'Missing fields'))
  if (!isValidSlug(sharedSlug)) return redirect(entityEditLocation('posts', id, fallbackEntityId, 'Invalid slug'))

  const existing = id
    ? await db.select(postRowSelection).from(schema.posts).where(eq(schema.posts.id, id!)).limit(1).get() as PostRow | undefined
    : null
  const pairKey = pairRefSlug || existing?.ref_slug || existing?.slug || sharedSlug
  const groupRows = existing
    ? await db
        .select(postRowSelection)
        .from(schema.posts)
        .where(or(eq(schema.posts.id, existing.id), eq(schema.posts.refSlug, pairKey), eq(schema.posts.slug, pairKey)))
        .orderBy(desc(schema.posts.updatedAt))
        .limit(4) as PostRow[]
    : []
  const existingZh = groupRows.find((item) => item.locale.toLowerCase().startsWith('zh')) ?? (existing?.locale.toLowerCase().startsWith('zh') ? existing : null)
  const existingEn = groupRows.find((item) => item.locale.toLowerCase().startsWith('en')) ?? (existing?.locale.toLowerCase().startsWith('en') ? existing : null)
  const zhId = existingZh?.id ?? (existing?.locale.toLowerCase().startsWith('zh') ? existing.id : ulid())
  const enId = existingEn?.id ?? (existing?.locale.toLowerCase().startsWith('en') ? existing.id : ulid())
  const postType = existing?.post_type || existingZh?.post_type || existingEn?.post_type || 'guide'
  if (existingZh) await writeRevision(env, user.userId, 'posts', existingZh.id, existingZh)
  if (existingEn && existingEn.id !== existingZh?.id) await writeRevision(env, user.userId, 'posts', existingEn.id, existingEn)

  let cover = currentCover ?? existing?.cover_image_key ?? existingZh?.cover_image_key ?? existingEn?.cover_image_key ?? null
  let uploadedNewCover = false
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      cover = await uploadImageToR2(env, coverFile, 'posts/covers', 'Post cover')
      uploadedNewCover = true
    } catch (e) {
      return redirect(entityEditLocation('posts', id, fallbackEntityId, (e as Error).message))
    }
  }

  try {
    const parsedPublishAt = publishAtRaw ? parseIsoOrNull(publishAtRaw) : null
    if (status === 'scheduled' && !parsedPublishAt) return redirect(entityEditLocation('posts', id, fallbackEntityId, 'publish_at required for scheduled'))
    await ensureUniquePostSlug(env, sharedSlug, 'zh', zhId)
    await ensureUniquePostSlug(env, sharedSlug, 'en', enId)
    if (categoryId) {
      const categoryExists = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.id, categoryId)).limit(1).get()
      if (!categoryExists) throw new Error('Invalid category_id')
    }
    if ((status === 'published' || status === 'scheduled') && cover) await ensureR2KeyExists(env, cover)
  } catch (e) {
    return redirect(entityEditLocation('posts', id, fallbackEntityId, (e as Error).message))
  }

  const publishedAt = toPublishedAt(status, now)
  const upsertPost = async (postId: string, title: string, excerpt: string | null, contentHtml: string, localeCode: string) => {
    await db
      .insert(schema.posts)
      .values({
        id: postId,
        categoryId,
        postType,
        refSlug: pairKey,
        title,
        slug: sharedSlug,
        excerpt,
        contentHtml,
        coverImageKey: cover,
        locale: localeCode,
        status,
        publishAt: publishAtRaw,
        publishedAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.posts.id,
        set: {
          categoryId,
          postType,
          refSlug: pairKey,
          title,
          slug: sharedSlug,
          excerpt,
          contentHtml,
          coverImageKey: cover,
          locale: localeCode,
          status,
          publishAt: publishAtRaw,
          publishedAt: publishedAt ?? sql`${schema.posts.publishedAt}`,
          updatedAt: now
        }
      })
  }
  await upsertPost(zhId, titleZh, excerptZh, contentZh, 'zh')
  await upsertPost(enId, titleEn, excerptEn, contentEn, 'en')

  await writeAudit(env, user.userId, id ? 'update' : 'create', 'posts', zhId, { slug: sharedSlug, status, locale: 'zh', pair_ref_slug: pairKey })
  await writeAudit(env, user.userId, id ? 'update' : 'create', 'posts', enId, { slug: sharedSlug, status, locale: 'en', pair_ref_slug: pairKey })
  if (status === 'published') {
    await writeAudit(env, user.userId, 'publish', 'posts', zhId, { published_at: now })
    await writeAudit(env, user.userId, 'publish', 'posts', enId, { published_at: now })
  }
  return redirect(`/admin/posts/${zhId}?success=${uploadedNewCover ? 'saved_with_image' : 'saved'}${uploadedNewCover ? '&uploaded=1' : ''}`)
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

async function uploadSiteIconToR2(env: Bindings, file: File, prefix: string, label: string): Promise<string> {
  if (file.size <= 0) throw new Error(`Empty ${label.toLowerCase()} file`)
  if (file.size > 8 * 1024 * 1024) throw new Error(`${label} file too large`)
  const contentType = file.type || 'application/octet-stream'
  const lower = file.name.toLowerCase()
  const isIco = contentType === 'image/x-icon' || contentType === 'image/vnd.microsoft.icon' || lower.endsWith('.ico')
  if (!isIco && !/^image\/(?:png|jpeg|webp|svg\+xml)$/i.test(contentType)) {
    throw new Error(`Unsupported ${label.toLowerCase()} image type`)
  }
  const ext = isIco ? '.ico' : guessExt(file.name, contentType)
  const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${ulid()}${ext}`
  await putObject(env, key, await file.arrayBuffer(), contentType)
  return key
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

