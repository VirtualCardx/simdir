import type { Bindings } from '../env'

export async function dbGet<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
  const r = await db.prepare(sql).bind(...params).first<T>()
  return r ?? null
}

export async function dbAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await db.prepare(sql).bind(...params).all<T>()
  return r.results ?? []
}

export async function dbExec(db: D1Database, sql: string, params: unknown[] = []): Promise<void> {
  await db.prepare(sql).bind(...params).run()
}

const columnCache = new Map<string, boolean>()

export async function hasColumn(db: D1Database, table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`
  if (columnCache.has(key)) return columnCache.get(key) === true
  const rows = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
  const ok = (rows.results ?? []).some((row) => String(row.name) === column)
  columnCache.set(key, ok)
  return ok
}

export async function bootstrapAdminIfNeeded(env: Bindings): Promise<void> {
  if (env.BOOTSTRAP_ADMIN !== 'true') return
  if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) return
  const existing = await env.DB.prepare('SELECT id FROM admin_users LIMIT 1').first<{ id: string }>()
  if (existing) return
  const email = env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim()
  const salt = crypto.randomUUID()
  const { hashPassword } = await import('./password')
  const passwordHash = await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD, salt)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO admin_users (id,email,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?)'
  )
    .bind(id, email, passwordHash, 'admin', now, now)
    .run()
}

