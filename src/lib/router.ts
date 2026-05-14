export type Handler = (ctx: { req: Request; params: Record<string, string> }) => Promise<Response> | Response

type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler }

export class Router {
  private routes: Route[] = []

  on(method: string, path: string, handler: Handler): this {
    const { pattern, keys } = compile(path)
    this.routes.push({ method: method.toUpperCase(), pattern, keys, handler })
    return this
  }

  async route(req: Request): Promise<Response | null> {
    const url = new URL(req.url)
    const method = req.method.toUpperCase()
    for (const r of this.routes) {
      if (r.method !== method) continue
      const m = r.pattern.exec(url.pathname)
      if (!m) continue
      const params: Record<string, string> = {}
      for (let i = 0; i < r.keys.length; i++) params[r.keys[i]] = decodeURIComponent(m[i + 1] ?? '')
      return await r.handler({ req, params })
    }
    return null
  }
}

function compile(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = []
  const pattern = path
    .split('/')
    .map((seg) => {
      if (!seg) return ''
      if (seg.startsWith(':')) {
        keys.push(seg.slice(1))
        return '([^/]+)'
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { pattern: new RegExp(`^${pattern}$`), keys }
}

