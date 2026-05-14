import type { Bindings } from '../env'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getDb } from './db'
import { mediaUrl } from './media'
import type { SiteLocale } from './i18n'

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

export type SiteSettings = {
  siteTitleZh: string
  siteTitleEn: string
  siteKeywordsZh: string
  siteKeywordsEn: string
  taglineZh: string
  taglineEn: string
  logoImageKey: string | null
  faviconImageKey: string | null
}

export async function getSiteSettings(env: Bindings): Promise<SiteSettings> {
  const db = getDb(env.DB)
  const row = await db
    .select({
      site_title: schema.siteSettings.siteTitle,
      site_title_zh: schema.siteSettings.siteTitleZh,
      site_title_en: schema.siteSettings.siteTitleEn,
      site_keywords: schema.siteSettings.siteKeywords,
      site_keywords_zh: schema.siteSettings.siteKeywordsZh,
      site_keywords_en: schema.siteSettings.siteKeywordsEn,
      tagline: schema.siteSettings.tagline,
      tagline_zh: schema.siteSettings.taglineZh,
      tagline_en: schema.siteSettings.taglineEn,
      logo_image_key: schema.siteSettings.logoImageKey,
      favicon_image_key: schema.siteSettings.faviconImageKey
    })
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.id, 'default'))
    .limit(1)
    .get() as SiteSettingsRow | undefined

  return {
    siteTitleZh: row?.site_title_zh?.trim() || row?.site_title?.trim() || env.SITE_NAME,
    siteTitleEn: row?.site_title_en?.trim() || row?.site_title?.trim() || env.SITE_NAME,
    siteKeywordsZh: row?.site_keywords_zh?.trim() || row?.site_keywords?.trim() || '',
    siteKeywordsEn: row?.site_keywords_en?.trim() || row?.site_keywords?.trim() || '',
    taglineZh: row?.tagline_zh?.trim() || row?.tagline?.trim() || '',
    taglineEn: row?.tagline_en?.trim() || row?.tagline?.trim() || '',
    logoImageKey: row?.logo_image_key?.trim() || null,
    faviconImageKey: row?.favicon_image_key?.trim() || null
  }
}

export function resolveSiteTitle(env: Bindings, settings: SiteSettings, locale: SiteLocale): string {
  const value = locale === 'zh' ? settings.siteTitleZh : settings.siteTitleEn
  const fallback = locale === 'zh' ? settings.siteTitleEn : settings.siteTitleZh
  return value.trim() || fallback.trim() || env.SITE_NAME
}

export function resolveSiteKeywords(settings: SiteSettings, locale: SiteLocale): string {
  const value = locale === 'zh' ? settings.siteKeywordsZh : settings.siteKeywordsEn
  const fallback = locale === 'zh' ? settings.siteKeywordsEn : settings.siteKeywordsZh
  return value.trim() || fallback.trim() || ''
}

export function resolveSiteTagline(settings: SiteSettings, locale: SiteLocale, fallback: string): string {
  const value = locale === 'zh' ? settings.taglineZh : settings.taglineEn
  const other = locale === 'zh' ? settings.taglineEn : settings.taglineZh
  return value.trim() || other.trim() || fallback
}

export function resolveSiteLogoUrl(env: Bindings, settings: SiteSettings): string | null {
  return settings.logoImageKey ? mediaUrl(env.APP_ORIGIN, settings.logoImageKey) : null
}

export function resolveSiteFaviconUrl(env: Bindings, settings: SiteSettings): string | null {
  return settings.faviconImageKey ? mediaUrl(env.APP_ORIGIN, settings.faviconImageKey) : null
}
