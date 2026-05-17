export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  APP_ORIGIN: string
  SITE_NAME: string
  JWT_ISSUER: string
  JWT_SECRET?: string
  ADMIN_API_BEARER_TOKEN?: string
  BOOTSTRAP_ADMIN?: string
  BOOTSTRAP_ADMIN_EMAIL?: string
  BOOTSTRAP_ADMIN_PASSWORD?: string
  ACCESS_TOKEN_TTL_SECONDS: string
  REFRESH_TOKEN_TTL_SECONDS: string
}

