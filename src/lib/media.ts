import type { Bindings } from '../env'

export function mediaUrl(origin: string, key: string): string {
  const u = new URL('/media/' + encodeURIComponent(key), origin)
  return u.toString()
}

export async function putObject(env: Bindings, key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  await env.R2.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    }
  })
}

export async function getObjectResponse(env: Bindings, key: string): Promise<Response | null> {
  const obj = await env.R2.get(key)
  if (!obj) return null
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('ETag', obj.httpEtag)
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(obj.body, { headers })
}

