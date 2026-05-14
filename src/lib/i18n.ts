import { getCookies, setCookie } from './http'

export type SiteLocale = 'zh' | 'en'

export function normalizeLocale(input: string | null | undefined): SiteLocale | '' {
  const value = (input ?? '').trim().toLowerCase()
  if (value.startsWith('zh')) return 'zh'
  if (value.startsWith('en')) return 'en'
  return ''
}

export function resolveLocale(req: Request): SiteLocale {
  const cookieLocale = normalizeLocale(getCookies(req).site_lang)
  if (cookieLocale) return cookieLocale
  const header = req.headers.get('Accept-Language') ?? ''
  return header.toLowerCase().includes('zh') ? 'zh' : 'en'
}

export function pick<T>(locale: SiteLocale, zh: T, en: T): T {
  return locale === 'zh' ? zh : en
}

export function localeLabel(locale: string | null | undefined): string {
  const normalized = normalizeLocale(locale)
  if (normalized === 'zh') return '中文'
  if (normalized === 'en') return 'English'
  return 'English'
}

export function languageSwitchHref(lang: SiteLocale, currentUrl: string): string {
  return `/set-language?lang=${encodeURIComponent(lang)}&redirect=${encodeURIComponent(currentUrl)}`
}

export function makeLocaleCookie(req: Request, locale: SiteLocale): string {
  const isLocal = new URL(req.url).hostname === 'localhost' || new URL(req.url).hostname === '127.0.0.1'
  return setCookie('site_lang', locale, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })
}

export function sanitizeRedirectPath(input: string | null | undefined): string {
  const value = input?.trim()
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}
