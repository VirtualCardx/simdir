function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)))
}

function b64urlToBytes(s: string): Uint8Array {
  const p = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(p)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data))
  return new Uint8Array(sig)
}

export type JwtPayload = {
  iss: string
  sub: string
  aud?: string
  exp: number
  iat: number
  jti?: string
  typ?: 'access' | 'refresh'
  role?: string
}

export async function signJwt(secret: string, payload: JwtPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const p1 = b64urlJson(header)
  const p2 = b64urlJson(payload)
  const data = `${p1}.${p2}`
  const sig = await hmacSha256(secret, data)
  return `${data}.${b64url(sig)}`
}

export async function verifyJwt(secret: string, token: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [p1, p2, p3] = parts
  const data = `${p1}.${p2}`
  const sigBytes = b64urlToBytes(p3)
  const sig = sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as unknown as BufferSource
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const ok = await crypto.subtle.verify('HMAC', k, sig, new TextEncoder().encode(data))
  if (!ok) return null
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p2))) as JwtPayload
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null
  return payload
}

