import { sql, type SQL } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import type { Bindings } from '../env'
import * as schema from '../db/schema'

export function getDb(db: D1Database) {
  return drizzle(db, { schema })
}

function positionalSql(query: string, params: unknown[] = []): SQL {
  const chunks = query.split('?')
  if (chunks.length !== params.length + 1) {
    throw new Error(`SQL placeholder mismatch: expected ${chunks.length - 1} params, received ${params.length}`)
  }
  let statement: SQL = sql.raw(chunks[0] ?? '')
  for (let index = 0; index < params.length; index += 1) {
    statement = sql`${statement}${params[index]}${sql.raw(chunks[index + 1] ?? '')}`
  }
  return statement
}

async function dbAll<T>(db: D1Database, query: string, params: unknown[] = []): Promise<T[]> {
  return await getDb(db).all<T>(positionalSql(query, params))
}

const columnCache = new Map<string, boolean>()

export async function hasColumn(db: D1Database, table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`
  if (columnCache.has(key)) return columnCache.get(key) === true
  const rows = await dbAll<{ name: string }>(db, `PRAGMA table_info(${table})`)
  const ok = rows.some((row) => String(row.name) === column)
  columnCache.set(key, ok)
  return ok
}

export async function bootstrapAdminIfNeeded(env: Bindings): Promise<void> {
  if (env.BOOTSTRAP_ADMIN !== 'true') return
  if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) return
  const db = getDb(env.DB)
  const existing = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1).get()
  if (existing) return
  const email = env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim()
  const salt = crypto.randomUUID()
  const { hashPassword } = await import('./password')
  const passwordHash = await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD, salt)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(schema.adminUsers).values({
    id,
    email,
    passwordHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now
  }).onConflictDoNothing({ target: schema.adminUsers.email })
}
