export function ulid(): string {
  const t = Date.now().toString(36).padStart(10, '0')
  const r = crypto.getRandomValues(new Uint8Array(16))
  let s = ''
  for (const b of r) s += b.toString(16).padStart(2, '0')
  return `01${t}${s}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

