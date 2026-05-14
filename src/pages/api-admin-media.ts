import type { Bindings } from '../env'
import { requireAdmin } from '../lib/auth'
import { badRequest, json, unauthorized } from '../lib/http'
import { ulid } from '../lib/ids'
import { mediaUrl, putObject } from '../lib/media'

export async function apiAdminUpload(env: Bindings, req: Request): Promise<Response> {
  const user = await requireAdmin(env, req)
  if (!user) return unauthorized()
  const form = await req.formData().catch(() => null)
  if (!form) return badRequest('Invalid form')
  const file = form.get('file')
  if (!(file instanceof File)) return badRequest('Missing file')
  if (file.size <= 0) return badRequest('Empty file')
  if (file.size > 8 * 1024 * 1024) return badRequest('File too large')
  const contentType = file.type || 'application/octet-stream'
  const ext = guessExt(file.name, contentType)
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${ulid()}${ext}`
  const buf = await file.arrayBuffer()
  await putObject(env, key, buf, contentType)
  return json({ ok: true, key, url: mediaUrl(env.APP_ORIGIN, key) })
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

