import type { Bindings } from '../env'
import { getCookies, setCookie } from './http'
import { ulid } from './ids'
import { signJwt, verifyJwt } from './jwt'

export type AuthUser = { userId: string; role: string }

export async function requireAdmin(env: Bindings, req: Request): Promise<AuthUser | null> {
  const secret = env.JWT_SECRET
  if (!secret) return null
  const cookies = getCookies(req)
  const token = cookies['access_token']
  if (!token) return null
  const payload = await verifyJwt(secret, token)
  if (!payload || payload.typ !== 'access') return null
  if (payload.iss !== env.JWT_ISSUER) return null
  return { userId: payload.sub, role: payload.role ?? 'admin' }
}

export async function issueTokens(env: Bindings, userId: string, role: string): Promise<{ access: string; refresh: string; refreshJti: string }> {
  const secret = env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET missing')
  const now = Math.floor(Date.now() / 1000)
  const accessTtl = parseInt(env.ACCESS_TOKEN_TTL_SECONDS, 10)
  const refreshTtl = parseInt(env.REFRESH_TOKEN_TTL_SECONDS, 10)
  const access = await signJwt(secret, {
    iss: env.JWT_ISSUER,
    sub: userId,
    iat: now,
    exp: now + accessTtl,
    typ: 'access',
    role
  })
  const refreshJti = ulid()
  const refresh = await signJwt(secret, {
    iss: env.JWT_ISSUER,
    sub: userId,
    iat: now,
    exp: now + refreshTtl,
    typ: 'refresh',
    jti: refreshJti,
    role
  })
  await env.KV.put(`rt:${refreshJti}`, userId, { expirationTtl: refreshTtl })
  return { access, refresh, refreshJti }
}

export function authCookies(tokens: { access: string; refresh: string }, secure: boolean): string[] {
  const accessCookie = setCookie('access_token', tokens.access, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60
  })
  const refreshCookie = setCookie('refresh_token', tokens.refresh, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/admin/auth',
    maxAge: 60 * 60 * 24 * 30
  })
  return [accessCookie, refreshCookie]
}

export function clearAuthCookies(secure: boolean): string[] {
  return [
    setCookie('access_token', '', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 }),
    setCookie('refresh_token', '', { httpOnly: true, secure, sameSite: 'lax', path: '/api/admin/auth', maxAge: 0 })
  ]
}

export async function refreshTokens(env: Bindings, req: Request): Promise<{ access: string; refresh: string } | null> {
  const secret = env.JWT_SECRET
  if (!secret) return null
  const cookies = getCookies(req)
  const rt = cookies['refresh_token']
  if (!rt) return null
  const payload = await verifyJwt(secret, rt)
  if (!payload || payload.typ !== 'refresh' || !payload.jti) return null
  if (payload.iss !== env.JWT_ISSUER) return null
  const exists = await env.KV.get(`rt:${payload.jti}`)
  if (!exists || exists !== payload.sub) return null
  await env.KV.delete(`rt:${payload.jti}`)
  const { access, refresh } = await issueTokens(env, payload.sub, payload.role ?? 'admin')
  return { access, refresh }
}

