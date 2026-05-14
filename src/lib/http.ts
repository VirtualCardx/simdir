import { parse as parseCookie, serialize as serializeCookie } from 'cookie'

export type CookieOptions = {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  maxAge?: number
}

export function getCookies(req: Request): Record<string, string> {
  const header = req.headers.get('Cookie') ?? ''
  return parseCookie(header)
}

export function setCookie(name: string, value: string, opts: CookieOptions = {}): string {
  return serializeCookie(name, value, {
    httpOnly: opts.httpOnly ?? true,
    secure: opts.secure ?? true,
    sameSite: opts.sameSite ?? 'lax',
    path: opts.path ?? '/',
    maxAge: opts.maxAge
  })
}

export function html(body: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  return new Response(body, { ...init, headers })
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: location } })
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 })
}

export function unauthorized(message = 'Unauthorized'): Response {
  return json({ error: message }, { status: 401 })
}

export function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

