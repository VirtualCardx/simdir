export async function cacheGet(req: Request): Promise<Response | null> {
  if (req.method !== 'GET') return null
  const cache = (caches as unknown as { default: Cache }).default
  const hit = await cache.match(req)
  return hit ?? null
}

export async function cachePut(req: Request, res: Response, ttlSeconds: number): Promise<void> {
  if (req.method !== 'GET') return
  const cache = (caches as unknown as { default: Cache }).default
  const headers = new Headers(res.headers)
  headers.set('Cache-Control', `s-maxage=${ttlSeconds}, no-cache`)
  const cached = new Response(res.body, { status: res.status, headers })
  await cache.put(req, cached)
}

