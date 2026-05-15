export const PBKDF2_ITERATIONS = 100000
export const PBKDF2_MIN_ITERATIONS = 10000
export const PBKDF2_MAX_ITERATIONS = 100000

function b64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function pbkdf2Sha256(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      iterations
    },
    key,
    256
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const iterations = PBKDF2_ITERATIONS
  const saltBytes = new TextEncoder().encode(salt)
  const dk = await pbkdf2Sha256(password, saltBytes, iterations)
  return `pbkdf2_sha256:${iterations}:${b64(saltBytes)}:${b64(dk)}`
}

export function parsePasswordHash(stored: string): { alg: string; iterations: number } | null {
  const parts = stored.split(':')
  if (parts.length !== 4) return null
  const [alg, iterStr] = parts
  const iterations = parseInt(iterStr, 10)
  if (!Number.isFinite(iterations)) return null
  return { alg, iterations }
}

export function isPasswordHashSupported(stored: string): boolean {
  const parsed = parsePasswordHash(stored)
  if (!parsed) return false
  return parsed.alg === 'pbkdf2_sha256' && parsed.iterations >= PBKDF2_MIN_ITERATIONS && parsed.iterations <= PBKDF2_MAX_ITERATIONS
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 4) return false
  const [alg, iterStr, saltB64, hashB64] = parts
  if (alg !== 'pbkdf2_sha256') return false
  const iterations = parseInt(iterStr, 10)
  if (!Number.isFinite(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) return false
  const saltBytes = b64ToBytes(saltB64)
  const expected = b64ToBytes(hashB64)
  const dk = await pbkdf2Sha256(password, saltBytes, iterations)
  return timingSafeEqual(expected, dk)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]
  return r === 0
}

