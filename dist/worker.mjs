var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/cookie@0.6.0/node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/.pnpm/cookie@0.6.0/node_modules/cookie/index.js"(exports) {
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var __toString = Object.prototype.toString;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options || {};
      var dec = opt.decode || decode;
      var index = 0;
      while (index < str.length) {
        var eqIdx = str.indexOf("=", index);
        if (eqIdx === -1) {
          break;
        }
        var endIdx = str.indexOf(";", index);
        if (endIdx === -1) {
          endIdx = str.length;
        } else if (endIdx < eqIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        var key = str.slice(index, eqIdx).trim();
        if (void 0 === obj[key]) {
          var val = str.slice(eqIdx + 1, endIdx).trim();
          if (val.charCodeAt(0) === 34) {
            val = val.slice(1, -1);
          }
          obj[key] = tryDecode(val, dec);
        }
        index = endIdx + 1;
      }
      return obj;
    }
    function serialize(name, val, options) {
      var opt = options || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (null != opt.maxAge) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        var expires = opt.expires;
        if (!isDate(expires) || isNaN(expires.valueOf())) {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.partitioned) {
        str += "; Partitioned";
      }
      if (opt.priority) {
        var priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError("option priority is invalid");
        }
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function decode(str) {
      return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
    }
    function encode(val) {
      return encodeURIComponent(val);
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]" || val instanceof Date;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// src/lib/password.ts
var password_exports = {};
__export(password_exports, {
  hashPassword: () => hashPassword,
  verifyPassword: () => verifyPassword
});
function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64ToBytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pbkdf2Sha256(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    key,
    256
  );
  return new Uint8Array(bits);
}
async function hashPassword(password, salt) {
  const iterations = 21e4;
  const saltBytes = new TextEncoder().encode(salt);
  const dk = await pbkdf2Sha256(password, saltBytes, iterations);
  return `pbkdf2_sha256:${iterations}:${b64(saltBytes)}:${b64(dk)}`;
}
async function verifyPassword(password, stored) {
  const parts = stored.split(":");
  if (parts.length !== 4) return false;
  const [alg, iterStr, saltB64, hashB64] = parts;
  if (alg !== "pbkdf2_sha256") return false;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations < 1e4) return false;
  const saltBytes = b64ToBytes(saltB64);
  const expected = b64ToBytes(hashB64);
  const dk = await pbkdf2Sha256(password, saltBytes, iterations);
  return timingSafeEqual(expected, dk);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}
var init_password = __esm({
  "src/lib/password.ts"() {
    "use strict";
  }
});

// src/lib/router.ts
var Router = class {
  constructor() {
    this.routes = [];
  }
  on(method, path, handler) {
    const { pattern, keys } = compile(path);
    this.routes.push({ method: method.toUpperCase(), pattern, keys, handler });
    return this;
  }
  async route(req) {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = r.pattern.exec(url.pathname);
      if (!m) continue;
      const params = {};
      for (let i = 0; i < r.keys.length; i++) params[r.keys[i]] = decodeURIComponent(m[i + 1] ?? "");
      return await r.handler({ req, params });
    }
    return null;
  }
};
function compile(path) {
  const keys = [];
  const pattern = path.split("/").map((seg) => {
    if (!seg) return "";
    if (seg.startsWith(":")) {
      keys.push(seg.slice(1));
      return "([^/]+)";
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { pattern: new RegExp(`^${pattern}$`), keys };
}

// src/lib/cache.ts
async function cacheGet(req) {
  if (req.method !== "GET") return null;
  const cache = caches.default;
  const hit = await cache.match(req);
  return hit ?? null;
}
async function cachePut(req, res, ttlSeconds) {
  if (req.method !== "GET") return;
  const cache = caches.default;
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", `public, max-age=${ttlSeconds}`);
  const cached = new Response(res.body, { status: res.status, headers });
  await cache.put(req, cached);
}

// src/lib/http.ts
var import_cookie = __toESM(require_cookie(), 1);
function getCookies(req) {
  const header = req.headers.get("Cookie") ?? "";
  return (0, import_cookie.parse)(header);
}
function setCookie(name, value, opts = {}) {
  return (0, import_cookie.serialize)(name, value, {
    httpOnly: opts.httpOnly ?? true,
    secure: opts.secure ?? true,
    sameSite: opts.sameSite ?? "lax",
    path: opts.path ?? "/",
    maxAge: opts.maxAge
  });
}
function html(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { ...init, headers });
}
function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
function redirect(location, status = 302) {
  return new Response(null, { status, headers: { Location: location } });
}
function badRequest(message) {
  return json({ error: message }, { status: 400 });
}
function unauthorized(message = "Unauthorized") {
  return json({ error: message }, { status: 401 });
}
function notFound() {
  return new Response("Not Found", { status: 404 });
}

// src/lib/db.ts
async function dbGet(db, sql, params = []) {
  const r = await db.prepare(sql).bind(...params).first();
  return r ?? null;
}
async function dbAll(db, sql, params = []) {
  const r = await db.prepare(sql).bind(...params).all();
  return r.results ?? [];
}
async function bootstrapAdminIfNeeded(env) {
  if (env.BOOTSTRAP_ADMIN !== "true") return;
  if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) return;
  const existing = await env.DB.prepare("SELECT id FROM admin_users LIMIT 1").first();
  if (existing) return;
  const email = env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim();
  const salt = crypto.randomUUID();
  const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_password(), password_exports));
  const passwordHash = await hashPassword2(env.BOOTSTRAP_ADMIN_PASSWORD, salt);
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    "INSERT INTO admin_users (id,email,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?)"
  ).bind(id, email, passwordHash, "admin", now, now).run();
}

// src/lib/media.ts
function mediaUrl(origin, key) {
  const u = new URL("/media/" + encodeURIComponent(key), origin);
  return u.toString();
}
async function putObject(env, key, data, contentType) {
  await env.R2.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable"
    }
  });
}
async function getObjectResponse(env, key) {
  const obj = await env.R2.get(key);
  if (!obj) return null;
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

// src/lib/i18n.ts
function normalizeLocale(input) {
  const value = (input ?? "").trim().toLowerCase();
  if (value.startsWith("zh")) return "zh";
  if (value.startsWith("en")) return "en";
  return "";
}
function resolveLocale(req) {
  const cookieLocale = normalizeLocale(getCookies(req).site_lang);
  if (cookieLocale) return cookieLocale;
  const header = req.headers.get("Accept-Language") ?? "";
  return header.toLowerCase().includes("zh") ? "zh" : "en";
}
function pick(locale, zh, en) {
  return locale === "zh" ? zh : en;
}
function localeLabel(locale) {
  const normalized = normalizeLocale(locale);
  if (normalized === "zh") return "\u4E2D\u6587";
  if (normalized === "en") return "English";
  return "English";
}
function languageSwitchHref(lang, currentUrl) {
  return `/set-language?lang=${encodeURIComponent(lang)}&redirect=${encodeURIComponent(currentUrl)}`;
}
function makeLocaleCookie(req, locale) {
  const isLocal = new URL(req.url).hostname === "localhost" || new URL(req.url).hostname === "127.0.0.1";
  return setCookie("site_lang", locale, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
function sanitizeRedirectPath(input) {
  const value = input?.trim();
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

// src/lib/seo.ts
function stripHtml(input) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function autoDescription(input, maxLen = 160) {
  const t = stripHtml(input);
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1).trimEnd() + "\u2026";
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/lib/templates.ts
function layout(meta, body, criticalCss2) {
  const jsonLd = (meta.jsonLd ?? []).map((o) => {
    const s = JSON.stringify(o).replace(/</g, "\\u003c");
    return `<script type="application/ld+json">${s}<\/script>`;
  }).join("");
  const robots = meta.robots ? `<meta name="robots" content="${escapeHtml(meta.robots)}">` : "";
  const ogImage = meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}"><meta name="twitter:image" content="${escapeHtml(meta.ogImage)}">` : "";
  const locale = meta.locale ?? "en";
  const langSwitchScript = `<script>
document.addEventListener('click', async function (event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest('a[data-lang-switch]');
  if (!(link instanceof HTMLAnchorElement)) return;
  event.preventDefault();
  const href = link.getAttribute('href');
  if (!href) return;
  const url = new URL(href, window.location.origin);
  const redirectTo = url.searchParams.get('redirect') || window.location.pathname + window.location.search;
  try {
    await fetch(url.toString(), { credentials: 'same-origin', cache: 'no-store' });
  } catch (_) {}
  window.location.assign(redirectTo);
});
<\/script>`;
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="canonical" href="${escapeHtml(meta.canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${escapeHtml(meta.canonical)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  ${robots}
  ${ogImage}
  <style>${criticalCss2}</style>
  ${langSwitchScript}
  ${jsonLd}
</head>
<body>
${body}
</body>
</html>`;
}
function criticalCss() {
  return `
:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;--bg:#feffef;--surface:#ffffff;--surface-soft:#f6fcfd;--primary:#015697;--primary-strong:#014578;--primary-soft:#d6ecf0;--text:#16344d;--muted:#5d7b8f;--border:rgba(1,86,151,.14);--border-strong:rgba(1,86,151,.24);--shadow:0 18px 44px rgba(1,86,151,.08);--radius:18px;--radius-sm:12px;--content:1180px;--c:var(--text);--m:var(--muted);--b:var(--border);--p:var(--primary)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;color:var(--text);background:radial-gradient(circle at top left,rgba(214,236,240,.95),transparent 24%),linear-gradient(180deg,#feffef 0%,#f9fff9 100%)}
a{color:var(--primary);text-decoration:none;transition:color .18s ease,transform .18s ease,background-color .18s ease,border-color .18s ease,box-shadow .18s ease}
a:hover{color:var(--primary-strong)}
img{max-width:100%;display:block}
header{position:sticky;top:0;z-index:20;width:100%;padding:10px 0;background:linear-gradient(180deg,rgba(254,255,239,.98),rgba(254,255,239,.94));backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid rgba(1,86,151,.1);box-shadow:0 8px 24px rgba(1,86,151,.04)}
main,footer{max-width:var(--content);margin:0 auto;padding:20px}
header nav.nav-shell{max-width:var(--content);margin:0 auto;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.nav-brand{display:inline-flex;align-items:center;gap:12px;min-width:240px;padding:10px 16px;border-radius:20px;border:1px solid var(--border);background:rgba(255,255,255,.84);box-shadow:0 10px 28px rgba(1,86,151,.08);color:var(--primary-strong)}
.nav-brand:hover{transform:translateY(-1px);color:var(--primary-strong)}
.brand-badge{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:46px;padding:0 12px;border-radius:14px;background:linear-gradient(135deg,var(--primary),#2a7ab6);color:#feffef;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.brand-copy{display:grid;gap:3px}
.brand-copy strong{font-size:1.3rem;line-height:1.05}
.brand-copy small{color:var(--muted);font-size:.8rem}
.nav-links{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;flex-wrap:wrap}
.nav-link{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;color:var(--text);font-weight:700}
.nav-link:hover{background:rgba(214,236,240,.82);color:var(--primary-strong)}
.nav-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto}
header form{margin:0}
main{padding-top:28px;padding-bottom:32px}
.hero,.page-header{display:grid;gap:18px;margin-bottom:24px;padding:28px;border:1px solid var(--border);border-radius:calc(var(--radius) + 6px);background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(214,236,240,.72));box-shadow:var(--shadow)}
.hero{grid-template-columns:minmax(0,1.25fr) minmax(280px,.9fr);align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(1,86,151,.08);color:var(--primary);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.page-header{grid-template-columns:1fr}
.stack{display:grid;gap:16px}
.split-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
.grid{display:grid;grid-template-columns:minmax(280px,340px) minmax(0,1fr);gap:18px;align-items:start}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.action-row,.chip-row{display:flex;flex-wrap:wrap;gap:10px}
.card{border:1px solid var(--border);border-radius:var(--radius);padding:18px;background:rgba(255,255,255,.92);box-shadow:var(--shadow)}
.card-link{display:flex;gap:14px;align-items:center;color:inherit;height:100%}
.card-link:hover{transform:translateY(-2px)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border-radius:999px;border:1px solid var(--border-strong);background:var(--primary-soft);color:var(--primary);font-weight:700;box-shadow:none}
.btn:hover{background:#cae5eb;border-color:rgba(1,86,151,.3)}
.btn.primary{background:var(--primary);border-color:var(--primary);color:#feffef;box-shadow:0 12px 24px rgba(1,86,151,.18)}
.btn.primary:hover{background:var(--primary-strong);border-color:var(--primary-strong)}
.input{width:100%;margin-top:6px;padding:12px 14px;border:1px solid var(--border-strong);border-radius:14px;background:#fff;color:var(--text);outline:none;transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease}
.input:focus{border-color:var(--primary);box-shadow:0 0 0 4px rgba(1,86,151,.12)}
label{display:block;font-weight:700;color:var(--text)}
h1,h2,h3{margin:0 0 12px;color:var(--primary-strong);line-height:1.15}
h1{font-size:clamp(2.1rem,4vw,3.2rem)}
h2{font-size:clamp(1.35rem,2vw,1.9rem);margin-top:0}
h3{font-size:1.05rem}
p{margin:0 0 12px;line-height:1.75;color:var(--muted)}
small{color:var(--muted)}
ul{margin:0;padding-left:20px}
code{padding:2px 8px;border-radius:999px;background:rgba(214,236,240,.7);color:var(--primary-strong)}
table{width:100%;border-collapse:collapse;background:transparent}
th,td{padding:14px 12px;text-align:left;border-bottom:1px solid var(--border)}
th{font-size:.84rem;letter-spacing:.03em;text-transform:uppercase;color:var(--muted)}
tbody tr:hover{background:rgba(214,236,240,.28)}
footer{padding-top:8px;padding-bottom:30px;color:var(--muted)}
form{display:grid;gap:0}
.notice{border-width:1px;border-style:solid}
.notice.success{border-color:rgba(1,86,151,.22);background:rgba(214,236,240,.68)}
.notice.error{border-color:rgba(160,42,42,.18);background:#fff4f1}
.notice.success p,.notice.success small{color:var(--primary-strong)}
.notice.error p,.notice.error small{color:#8e3f34}
.hint-success{color:var(--primary-strong)!important}
.table-wrap{overflow:auto;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,.7)}
.toolbar{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}
.muted-panel{background:linear-gradient(180deg,rgba(214,236,240,.58),rgba(255,255,255,.9))}
.section-gap{display:grid;gap:20px}
.hero-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.stat{padding:14px 16px;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,.72)}
.stat strong{display:block;font-size:1.2rem;color:var(--primary-strong)}
.detail-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.8fr);gap:18px;align-items:start}
.soft-card{border:1px solid var(--border);border-radius:16px;padding:16px;background:rgba(255,255,255,.72)}
.meta-list{display:grid;gap:12px}
.meta-item{display:grid;gap:4px}
.faq-list{display:grid;gap:12px}
.faq-item{padding:16px;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.78)}
.badge-list{display:flex;flex-wrap:wrap;gap:8px}
.badge{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(214,236,240,.82);color:var(--primary-strong);font-weight:700}
.inline-media{border-radius:16px;border:1px solid var(--border);object-fit:cover;box-shadow:var(--shadow)}
.admin-shell{display:grid;gap:20px}
.admin-actions{display:flex;flex-wrap:wrap;gap:10px}
.content-prose{display:grid;gap:12px}
.content-prose p:last-child{margin-bottom:0}
@media (max-width:960px){
header{padding:10px 0}
main,footer{padding:16px}
.hero,.split-grid,.grid,.detail-layout{grid-template-columns:1fr}
.page-header,.hero{padding:22px}
header nav.nav-shell{gap:12px;padding:0 16px}
.nav-brand{min-width:0;width:100%}
.nav-links{width:100%;justify-content:flex-start}
.nav-actions{width:100%;justify-content:flex-end}
h1{font-size:2rem}
}
`;
}

// src/pages/public.ts
function postsUrl(category, lang) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (lang) qs.set("lang", lang);
  const query = qs.toString();
  return query ? `/posts?${query}` : "/posts";
}
function publicHeader(env, req, locale, links) {
  const current = new URL(req.url);
  const currentPath = `${current.pathname}${current.search}`;
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/" aria-label="Home">
        <span class="brand-badge">eSIM</span>
        <span class="brand-copy">
          <strong>${escapeHtml(env.SITE_NAME)}</strong>
          <small>${escapeHtml(pick(locale, "\u5168\u7403\u65C5\u884C\u4E0A\u7F51\u6307\u5357", "Global travel connectivity guide"))}</small>
        </span>
      </a>
      <div class="nav-links">
        ${links.map((link) => `<a class="nav-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("")}
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === "zh" ? "primary" : ""}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref("zh", currentPath))}">\u4E2D\u6587</a>
        <a class="btn ${locale === "en" ? "primary" : ""}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref("en", currentPath))}">EN</a>
        <a class="btn primary" href="/admin/login">${escapeHtml(pick(locale, "\u7BA1\u7406\u540E\u53F0", "Admin"))}</a>
      </div>
    </nav>
  </header>`;
}
async function homePage(env, req) {
  const locale = resolveLocale(req);
  const [countries, operators, postCategories] = await Promise.all([
    dbAll(env.DB, "SELECT name, slug FROM countries WHERE status='published' ORDER BY name ASC LIMIT 60"),
    dbAll(
      env.DB,
      "SELECT name, slug, logo_image_key FROM operators WHERE status='published' ORDER BY updated_at DESC LIMIT 12"
    ),
    dbAll(
      env.DB,
      "SELECT c.name, c.slug, COUNT(p.id) as post_count FROM categories c LEFT JOIN posts p ON p.category_id=c.id AND p.status='published' GROUP BY c.id, c.name, c.slug ORDER BY post_count DESC, c.sort_order ASC, c.name ASC LIMIT 8"
    )
  ]);
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="hero" aria-label="Hero">
      <div class="card">
        <span class="eyebrow">${escapeHtml(pick(locale, "\u5168\u7403 eSIM \u76EE\u5F55", "Global eSIM Directory"))}</span>
        <h1>${escapeHtml(pick(locale, "\u6309\u56FD\u5BB6\u67E5\u627E\u5E76\u5BF9\u6BD4 eSIM \u5957\u9910", "Find and compare eSIM plans by country"))}</h1>
        <p>${escapeHtml(pick(locale, "\u9762\u5411\u5168\u7403\u7528\u6237\u7684 eSIM \u76EE\u5F55\uFF0C\u805A\u5408\u56FD\u5BB6\u9875\u3001\u4F9B\u5E94\u5546\u9875\u4E0E\u5957\u9910\u8BE6\u60C5\uFF0C\u652F\u6301 SEO \u843D\u5730\u3001\u5FEB\u901F\u7B5B\u9009\u4E0E\u8D2D\u4E70\u8DF3\u8F6C\u3002", "A global eSIM directory with country pages, operator profiles, and product details for fast search and conversion."))}</p>
        <div class="hero-stats">
          <div class="stat"><small>${escapeHtml(pick(locale, "\u56FD\u5BB6\u5165\u53E3", "Countries"))}</small><strong>${countries.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, "\u5DF2\u53D1\u5E03\u4F9B\u5E94\u5546", "Published operators"))}</small><strong>${operators.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, "\u4F7F\u7528\u573A\u666F", "Use cases"))}</small><strong>${escapeHtml(pick(locale, "\u65C5\u884C / \u5546\u52A1 / \u957F\u4F4F", "Travel / Business / Living"))}</strong></div>
        </div>
      </div>
      <div class="card muted-panel">
        <h2>${escapeHtml(pick(locale, "\u5FEB\u901F\u641C\u7D22", "Quick Search"))}</h2>
        <form method="GET" action="/search" aria-label="Search">
          <label>
            <span><small>${escapeHtml(pick(locale, "\u5173\u952E\u8BCD\uFF08\u56FD\u5BB6/\u4F9B\u5E94\u5546\uFF09", "Keyword (country / operator)"))}</small></span>
            <input class="input" name="q" placeholder="${escapeHtml(pick(locale, "\u65E5\u672C / Airalo", "Japan / Airalo"))}" />
          </label>
          <div style="height:8px"></div>
          <div class="action-row">
            <button class="btn primary" type="submit">${escapeHtml(pick(locale, "\u641C\u7D22", "Search"))}</button>
            <a class="btn" href="/posts">${escapeHtml(pick(locale, "\u6D4F\u89C8\u8D44\u8BAF", "Browse news"))}</a>
          </div>
        </form>
      </div>
    </section>
    <section class="split-grid" aria-label="Directory">
      <div class="card">
        <h2>${escapeHtml(pick(locale, "\u70ED\u95E8\u56FD\u5BB6", "Popular countries"))}</h2>
        <p>${escapeHtml(pick(locale, "\u4ECE\u56FD\u5BB6\u5165\u53E3\u5FEB\u901F\u8FDB\u5165\u5BF9\u5E94\u7684\u5957\u9910\u4E0E\u8FD0\u8425\u5546\u5217\u8868\u9875\u3002", "Jump from country hubs to available operators and plans."))}</p>
        <div class="chip-row">
          ${countries.map((c) => `<a class="btn" href="/country/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a>`).join("")}
        </div>
      </div>
      <section class="card muted-panel" aria-label="Operators">
      <h2>${escapeHtml(pick(locale, "\u6700\u65B0\u4F9B\u5E94\u5546", "Latest operators"))}</h2>
      <p>${escapeHtml(pick(locale, "\u9996\u9875\u4EC5\u5C55\u793A\u5DF2\u53D1\u5E03\u7684\u4F9B\u5E94\u5546\u3002", "The homepage only shows published operators."))}</p>
      <div class="card-grid">
        ${operators.map((o) => {
    const logo = o.logo_image_key ? `<img src="${escapeHtml(mediaUrl(env.APP_ORIGIN, o.logo_image_key))}" alt="${escapeHtml(o.name)} logo" width="48" height="48" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover" />` : "";
    return `<a class="card card-link" href="/operator/${escapeHtml(o.slug)}">
              ${logo}
              <div>
                <strong>${escapeHtml(o.name)}</strong>
                <div><small>${escapeHtml(pick(locale, "\u67E5\u770B\u4F9B\u5E94\u5546\u8BE6\u60C5", "View operator details"))}</small></div>
              </div>
            </a>`;
  }).join("")}
      </div>
      </section>
    </section>
    <section class="card">
      <h2>${escapeHtml(pick(locale, "\u70ED\u95E8\u8D44\u8BAF\u7C7B\u578B", "Popular news categories"))}</h2>
      <p>${escapeHtml(pick(locale, "\u6309\u8D44\u8BAF\u7C7B\u578B\u5FEB\u901F\u8FDB\u5165\u5DF2\u53D1\u5E03\u6587\u7AE0\u805A\u5408\u9875\u3002", "Jump into published article collections by topic."))}</p>
      <div class="card-grid">
        ${postCategories.map((c) => `<a class="card card-link" href="/posts/category/${escapeHtml(c.slug)}"><div><strong>${escapeHtml(c.name)}</strong><div><small>${escapeHtml(String(c.post_count))} ${escapeHtml(pick(locale, "\u7BC7\u6587\u7AE0", "articles"))}</small></div></div></a>`).join("")}
      </div>
    </section>
  </main>
  <footer>
    <small>${escapeHtml(pick(locale, "\u514D\u8D23\u58F0\u660E\uFF1A\u4EF7\u683C\u4E0E\u8986\u76D6\u8303\u56F4\u53EF\u80FD\u53D8\u5316\uFF0C\u672C\u7AD9\u4E0D\u76F4\u63A5\u9500\u552E eSIM\u3002", "Disclaimer: prices and coverage may change. This site does not sell eSIMs directly."))}</small>
  </footer>
  `;
  const canonical = new URL("/", env.APP_ORIGIN).toString();
  const meta = {
    title: pick(locale, `\u5168\u7403 eSIM \u76EE\u5F55\uFF1A\u6309\u56FD\u5BB6\u67E5\u627E\u4E0E\u5BF9\u6BD4 | ${env.SITE_NAME}`, `Global eSIM Directory | ${env.SITE_NAME}`),
    description: pick(locale, "\u6D4F\u89C8\u5404\u56FD\u5BB6/\u5730\u533A eSIM \u4F9B\u5E94\u5546\u4E0E\u5957\u9910\uFF0C\u652F\u6301\u7B5B\u9009\u4E0E\u8DF3\u8F6C\u8D2D\u4E70\u3002", "Browse eSIM operators and plans by country with fast filtering and outbound purchase links."),
    canonical,
    locale: locale === "zh" ? "zh-CN" : "en",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: env.SITE_NAME,
        url: canonical
      }
    ]
  };
  return html(layout(meta, body, criticalCss()), {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
async function postsIndexPage(env, req) {
  const locale = resolveLocale(req);
  const url = new URL(req.url);
  const category = (url.searchParams.get("category") ?? "").trim();
  const lang = locale;
  const params = [];
  const where = ["p.status='published'"];
  if (category) {
    where.push("c.slug=?");
    params.push(category);
  }
  if (lang) {
    where.push("lower(p.locale) LIKE ?");
    params.push(`${lang}%`);
  }
  const [posts, categories] = await Promise.all([
    dbAll(
      env.DB,
      `SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where.join(" AND ")} ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 200`,
      params
    ),
    dbAll(env.DB, "SELECT name, slug FROM categories ORDER BY sort_order ASC, name ASC LIMIT 100")
  ]);
  const canonical = new URL(postsUrl(category, lang), env.APP_ORIGIN).toString();
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="card muted-panel">
      <h2>${escapeHtml(pick(locale, "\u6587\u7AE0\u7C7B\u578B", "Article Types"))}</h2>
      <div class="chip-row">
        <a class="btn ${!category ? "primary" : ""}" href="${postsUrl("", lang)}">${escapeHtml(pick(locale, "\u5168\u90E8\u8D44\u8BAF", "All Articles"))}</a>
        ${categories.map((c) => `<a class="btn ${category === c.slug ? "primary" : ""}" href="${postsUrl(c.slug, lang)}">${escapeHtml(c.name)}</a>`).join("")}
      </div>
    </section>
    <section class="card">
      <h1>${escapeHtml(pick(locale, "\u5DF2\u53D1\u5E03 SIM\u5361\u8D44\u8BAF", "Published SIM Card News"))}</h1>
      <p>${escapeHtml(pick(locale, "\u5F53\u524D\u5217\u8868\u4EC5\u5C55\u793A\u7CFB\u7EDF\u4E2D\u5DF2\u53D1\u5E03\u7684\u6587\u7AE0\uFF0C\u5E76\u8DDF\u968F\u5168\u7AD9\u8BED\u8A00\u663E\u793A\u3002", "This list only shows published articles and follows the current site language."))}</p>
      <ul>
        ${posts.map((p) => {
    const date = p.published_at ?? p.updated_at;
    return `<li style="margin:10px 0">
              <a href="/post/${escapeHtml(p.slug)}"><strong>${escapeHtml(p.title)}</strong></a>
              <div><small>${escapeHtml(date)}</small></div>
              <div class="chip-row" style="margin-top:6px">
                <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
                ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, lang)}">${escapeHtml(p.category_name)}</a>` : ""}
              </div>
              ${p.excerpt ? `<div><small>${escapeHtml(p.excerpt)}</small></div>` : ""}
            </li>`;
  }).join("")}
      </ul>
    </section>
  </main>
  `;
  return html(
    layout(
      {
        title: pick(locale, `SIM\u5361\u8D44\u8BAF | ${env.SITE_NAME}`, `SIM Card News | ${env.SITE_NAME}`),
        description: pick(locale, "\u6D4F\u89C8\u7CFB\u7EDF\u4E2D\u5DF2\u53D1\u5E03\u7684 SIM \u5361\u8D44\u8BAF\u6587\u7AE0\u3002", "Browse published SIM card news and guides in the system."),
        canonical,
        locale: locale === "zh" ? "zh-CN" : "en",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News"),
            url: canonical
          }
        ]
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
async function postCategoryPage(env, req, slug) {
  const locale = resolveLocale(req);
  const lang = locale;
  const category = await dbGet(env.DB, "SELECT id, name, slug FROM categories WHERE slug=?", [slug]);
  if (!category) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const sql = "SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND p.category_id=?" + (lang ? " AND lower(p.locale) LIKE ?" : "") + " ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 200";
  const posts = await dbAll(
    env.DB,
    sql,
    lang ? [category.id, `${lang}%`] : [category.id]
  );
  const categoryUrl = `/posts/category/${category.slug}`;
  const canonical = new URL(categoryUrl, env.APP_ORIGIN).toString();
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">\u9996\u9875</a> / <a href="/posts">${escapeHtml(pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News"))}</a> / ${escapeHtml(category.name)}</small></nav>
      <div>
        <span class="eyebrow">${escapeHtml(pick(locale, "\u5206\u7C7B\u9875", "Category"))}</span>
        <h1>${escapeHtml(category.name)}</h1>
        <p>${escapeHtml(pick(locale, "\u6D4F\u89C8", "Browse"))} ${escapeHtml(category.name)} ${escapeHtml(pick(locale, "\u5206\u7C7B\u4E0B\u5DF2\u53D1\u5E03\u7684\u6587\u7AE0\u5185\u5BB9\uFF0C\u5E76\u8DDF\u968F\u5168\u7AD9\u8BED\u8A00\u663E\u793A\u3002", "published articles in this category, following the current site language."))}</p>
      </div>
    </section>
    <section class="card">
      <div class="action-row">
        <a class="btn" href="/posts">${escapeHtml(pick(locale, "\u8FD4\u56DE\u5168\u90E8\u6587\u7AE0", "Back to all articles"))}</a>
      </div>
      <div style="height:12px"></div>
      <ul>
        ${posts.map((p) => {
    const date = p.published_at ?? p.updated_at;
    return `<li style="margin:10px 0">
              <a href="/post/${escapeHtml(p.slug)}"><strong>${escapeHtml(p.title)}</strong></a>
              <div><small>${escapeHtml(date)}</small></div>
              <div><small>${escapeHtml(localeLabel(p.locale))}</small></div>
              ${p.excerpt ? `<div><small>${escapeHtml(p.excerpt)}</small></div>` : ""}
            </li>`;
  }).join("")}
      </ul>
    </section>
  </main>
  `;
  return html(
    layout(
      {
        title: `${category.name} | ${env.SITE_NAME}`,
        description: pick(locale, `${category.name} \u5206\u7C7B\u4E0B\u7684 SIM\u5361\u8D44\u8BAF\u6587\u7AE0\u3002`, `SIM card news articles under ${category.name}.`),
        canonical,
        locale: locale === "zh" ? "zh-CN" : "en",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.name,
            url: canonical
          }
        ]
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
async function postPage(env, req, slug) {
  const locale = resolveLocale(req);
  const p = await dbGet(
    env.DB,
    "SELECT p.title, p.slug, p.excerpt, p.content_html, p.cover_image_key, p.locale, p.post_type, c.name as category_name, c.slug as category_slug, p.published_at, p.updated_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status='published'",
    [slug]
  );
  if (!p) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const canonical = new URL(`/post/${p.slug}`, env.APP_ORIGIN).toString();
  const ogImage = p.cover_image_key ? mediaUrl(env.APP_ORIGIN, p.cover_image_key) : void 0;
  const desc = p.excerpt ?? autoDescription(p.content_html);
  const published = p.published_at ?? p.updated_at;
  const related = p.category_slug ? await dbAll(
    env.DB,
    "SELECT p.title, p.slug FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND c.slug=? AND p.slug<>? AND lower(p.locale) LIKE ? ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 4",
    [p.category_slug, p.slug, `${normalizeLocale(p.locale) || "en"}%`]
  ) : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    datePublished: published,
    dateModified: p.updated_at,
    mainEntityOfPage: canonical,
    image: ogImage ? [ogImage] : void 0
  };
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="page-header">
      <nav aria-label="Breadcrumb"><small><a href="/">\u9996\u9875</a> / <a href="/posts">${escapeHtml(pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News"))}</a>${p.category_name && p.category_slug ? ` / <a href="/posts?category=${encodeURIComponent(p.category_slug)}">${escapeHtml(p.category_name)}</a>` : ""} / ${escapeHtml(p.title)}</small></nav>
      <div>
        <h1>${escapeHtml(p.title)}</h1>
        <small>${escapeHtml(published)}</small>
        <div class="chip-row" style="margin-top:8px">
          <span class="btn">${escapeHtml(localeLabel(p.locale))}</span>
          ${p.category_name && p.category_slug ? `<a class="btn" href="${postsUrl(p.category_slug, normalizeLocale(p.locale))}">${escapeHtml(p.category_name)}</a>` : ""}
        </div>
      </div>
    </section>
    ${ogImage ? `<div style="height:12px"></div><img src="${escapeHtml(ogImage)}" alt="${escapeHtml(p.title)}" loading="lazy" style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;border:1px solid var(--b)" />` : ""}
    <div style="height:12px"></div>
    <section class="card content-prose" aria-label="Post">${p.content_html}</section>
    ${related.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, "\u540C\u5206\u7C7B\u63A8\u8350", "More in this category"))}</h2><div class="card-grid">${related.map((item) => `<a class="card card-link" href="/post/${escapeHtml(item.slug)}"><div><strong>${escapeHtml(item.title)}</strong><div><small>${escapeHtml(pick(locale, "\u7EE7\u7EED\u9605\u8BFB", "Continue reading"))}</small></div></div></a>`).join("")}</div></section>` : ""}
  </main>
  `;
  return html(
    layout(
      {
        title: `${p.title} | ${env.SITE_NAME}`,
        description: desc,
        canonical,
        ogImage,
        locale: normalizeLocale(p.locale) === "zh" ? "zh-CN" : "en",
        jsonLd: [jsonLd]
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" } }
  );
}
async function searchPage(env, req) {
  const locale = resolveLocale(req);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const country = (url.searchParams.get("country") ?? "").trim().toLowerCase();
  const qLike = q ? `%${q.toLowerCase()}%` : null;
  const [countries, operators, products] = await Promise.all([
    qLike ? dbAll(
      env.DB,
      "SELECT name, slug, iso2 FROM countries WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ? OR lower(iso2) LIKE ?) ORDER BY name ASC LIMIT 12",
      [qLike, qLike, qLike]
    ) : Promise.resolve([]),
    qLike ? dbAll(
      env.DB,
      "SELECT name, slug, logo_image_key FROM operators WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ?) ORDER BY updated_at DESC LIMIT 12",
      [qLike, qLike]
    ) : Promise.resolve([]),
    (() => {
      const where = ["p.status='published'", "o.status='published'", "c.status='published'"];
      const params = [];
      if (country) {
        where.push("p.country_iso2=?");
        params.push(country);
      }
      if (qLike) {
        where.push("(lower(p.name) LIKE ? OR lower(o.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.slug) LIKE ? OR lower(c.iso2) LIKE ?)");
        params.push(qLike, qLike, qLike, qLike, qLike);
      }
      return dbAll(
        env.DB,
        `SELECT p.name, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, o.name as operator_name, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id JOIN countries c ON c.iso2=p.country_iso2 WHERE ${where.join(" AND ")} ORDER BY p.price_amount ASC LIMIT 100`,
        params
      );
    })()
  ]);
  const canonical = new URL(`/search?${url.searchParams.toString()}`, env.APP_ORIGIN).toString();
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="page-header">
      <span class="eyebrow">${escapeHtml(pick(locale, "\u641C\u7D22", "Search"))}</span>
      <div>
        <h1>${escapeHtml(pick(locale, "\u641C\u7D22\u7ED3\u679C", "Search Results"))}</h1>
        <p>${escapeHtml(pick(locale, "\u5173\u952E\u8BCD\uFF1A", "Keyword:"))}<strong>${escapeHtml(q || "\u2014")}</strong>${escapeHtml(pick(locale, "\uFF0C\u547D\u4E2D\u56FD\u5BB6 ", ", matched "))}${countries.length}${escapeHtml(pick(locale, " \u9879\u3001\u4F9B\u5E94\u5546 ", " countries, "))}${operators.length}${escapeHtml(pick(locale, " \u9879\u3001\u5957\u9910 ", " operators, and "))}${products.length}${escapeHtml(pick(locale, " \u9879\u5957\u9910\u3002", " plans."))}</p>
      </div>
    </section>
    ${!q && !country ? `<section class="card muted-panel"><p>${escapeHtml(pick(locale, "\u8BF7\u8F93\u5165\u56FD\u5BB6\u3001\u8FD0\u8425\u5546\u6216\u5957\u9910\u5173\u952E\u8BCD\uFF0C\u4F8B\u5982 ", "Enter a country, operator, or plan keyword such as "))}<strong>Japan</strong> / <strong>Airalo</strong>.</p></section>` : ""}
    ${countries.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, "\u56FD\u5BB6\u7ED3\u679C", "Country results"))}</h2><div class="card-grid">${countries.map((c) => `<a class="card card-link" href="/country/${escapeHtml(c.slug)}"><div><strong>${escapeHtml(c.name)}</strong><div><small>${escapeHtml(c.iso2.toUpperCase())}</small></div></div></a>`).join("")}</div></section>` : ""}
    ${operators.length > 0 ? `<section class="card"><h2>${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546\u7ED3\u679C", "Operator results"))}</h2><div class="card-grid">${operators.map((o) => {
    const logo = o.logo_image_key ? `<img src="${escapeHtml(mediaUrl(env.APP_ORIGIN, o.logo_image_key))}" alt="${escapeHtml(o.name)} logo" width="48" height="48" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover" />` : "";
    return `<a class="card card-link" href="/operator/${escapeHtml(o.slug)}">${logo}<div><strong>${escapeHtml(o.name)}</strong><div><small>${escapeHtml(pick(locale, "\u67E5\u770B\u4F9B\u5E94\u5546\u8BE6\u60C5", "View operator details"))}</small></div></div></a>`;
  }).join("")}</div></section>` : ""}
    <section class="card">
      <h2>${escapeHtml(pick(locale, "\u5957\u9910\u7ED3\u679C", "Plan results"))}</h2>
      <div class="table-wrap">
      <table>
        <thead><tr><th>\u4F9B\u5E94\u5546</th><th>\u5957\u9910</th><th>\u5929\u6570</th><th>\u6D41\u91CF</th><th>\u4EF7\u683C</th><th></th></tr></thead>
        <tbody>
          ${products.length > 0 ? products.map((p) => {
    const data = p.is_unlimited ? "\u65E0\u9650" : p.data_gb ? `${p.data_gb}GB` : "\u2014";
    const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`;
    return `<tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(p.operator_name)}</a></td>
                <td><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a></td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">\u53BB\u8D2D\u4E70</a></td>
              </tr>`;
  }).join("") : '<tr><td colspan="6"><small>\u6682\u65E0\u5339\u914D\u5957\u9910\uFF0C\u8BF7\u5C1D\u8BD5\u56FD\u5BB6\u540D\u3001\u4F9B\u5E94\u5546\u540D\u6216\u66F4\u77ED\u7684\u5173\u952E\u8BCD\u3002</small></td></tr>'}
        </tbody>
      </table>
      </div>
    </section>
  </main>
  `;
  return html(
    layout(
      {
        title: `\u641C\u7D22 eSIM \u5957\u9910 | ${env.SITE_NAME}`,
        description: q ? `\u641C\u7D22 ${q} \u7684 eSIM \u5957\u9910\u4E0E\u4F9B\u5E94\u5546\u3002` : "\u641C\u7D22 eSIM \u5957\u9910\u4E0E\u4F9B\u5E94\u5546\u3002",
        canonical
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
  );
}
async function productPage(env, req, slug) {
  const locale = resolveLocale(req);
  const p = await dbGet(
    env.DB,
    "SELECT p.id, p.name, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, p.coverage_regions_json, p.activation_guide_html, p.country_iso2, o.name as operator_name, o.slug as operator_slug, o.website_url as operator_website, p.status, p.updated_at FROM products p JOIN operators o ON o.id=p.operator_id WHERE p.slug=? AND p.status='published' AND o.status='published'",
    [slug]
  );
  if (!p) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const canonical = new URL(`/product/${String(p.slug)}`, env.APP_ORIGIN).toString();
  const title = `${String(p.name)} | ${env.SITE_NAME}`;
  const activation = String(p.activation_guide_html ?? "");
  const desc = autoDescription(activation || `${String(p.name)} eSIM \u5957\u9910\uFF0C\u652F\u6301\u8DF3\u8F6C\u8D2D\u4E70\u3002`);
  const data = Number(p.is_unlimited) ? pick(locale, "\u65E0\u9650", "Unlimited") : p.data_gb ? `${Number(p.data_gb)}GB` : "\u2014";
  const price = `${String(p.price_currency)} ${Number(p.price_amount).toFixed(2)}`;
  const offers = {
    "@type": "Offer",
    priceCurrency: String(p.price_currency),
    price: Number(p.price_amount),
    url: String(p.purchase_url),
    availability: "https://schema.org/InStock"
  };
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(p.name),
    brand: { "@type": "Brand", name: String(p.operator_name) },
    offers
  };
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, "\u9996\u9875", "Home"))}</a> / <a href="/operator/${escapeHtml(String(p.operator_slug))}">${escapeHtml(String(p.operator_name))}</a> / ${escapeHtml(String(p.name))}</small></nav>
    <h1>${escapeHtml(String(p.name))}</h1>
    <section class="card" aria-label="Specs">
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u56FD\u5BB6", "Country"))}</small><div><strong>${escapeHtml(String(p.country_iso2).toUpperCase())}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u5929\u6570", "Days"))}</small><div><strong>${escapeHtml(String(p.days))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u6D41\u91CF", "Data"))}</small><div><strong>${escapeHtml(data)}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u70ED\u70B9", "Hotspot"))}</small><div><strong>${escapeHtml(Number(p.supports_hotspot) ? pick(locale, "\u652F\u6301", "Supported") : pick(locale, "\u4E0D\u652F\u6301", "Not supported"))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u7F51\u7EDC", "Network"))}</small><div><strong>${escapeHtml(String(p.network_type ?? "\u2014"))}</strong></div></div>
        <div class="card" style="flex:1;min-width:220px"><small>${escapeHtml(pick(locale, "\u4EF7\u683C", "Price"))}</small><div><strong>${escapeHtml(price)}</strong></div></div>
      </div>
      <div style="height:12px"></div>
      <a class="btn primary" href="${escapeHtml(String(p.purchase_url))}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, "\u53BB\u8D2D\u4E70", "Buy now"))}</a>
      <small style="display:block;margin-top:8px">${escapeHtml(pick(locale, "\u5916\u94FE\u5C06\u5728\u65B0\u7A97\u53E3\u6253\u5F00\uFF0C\u4EF7\u683C\u4EE5\u4F9B\u5E94\u5546\u9875\u9762\u4E3A\u51C6\u3002", "External link opens in a new tab. Final price is determined by the operator."))}</small>
    </section>
    <h2>${escapeHtml(pick(locale, "\u6FC0\u6D3B\u6559\u7A0B", "Activation Guide"))}</h2>
    <section class="card" aria-label="Activation">${activation || `<p>${escapeHtml(pick(locale, "\u8BF7\u6309\u4F9B\u5E94\u5546\u63D0\u4F9B\u7684\u4E8C\u7EF4\u7801/\u6FC0\u6D3B\u7801\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u4E2D\u6DFB\u52A0 eSIM\u3002", "Use the operator QR code or activation code to add the eSIM in your device settings."))}</p>`}</section>
  </main>
  <footer><small>${escapeHtml(pick(locale, "\u672C\u7AD9\u4E0D\u76F4\u63A5\u9500\u552E eSIM\u3002", "This site does not directly sell eSIMs."))}</small></footer>
  `;
  return html(
    layout(
      {
        title,
        description: pick(locale, desc, autoDescription(activation || `${String(p.name)} eSIM plan with external purchase link.`)),
        canonical,
        locale: locale === "zh" ? "zh-CN" : "en",
        jsonLd: [productJsonLd]
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" } }
  );
}
async function countryPage(env, req, slug) {
  const locale = resolveLocale(req);
  const c = await dbGet(
    env.DB,
    "SELECT name, slug, iso2, seo_title, seo_description, content_html, hero_image_key, faq_json FROM countries WHERE slug=? AND status='published'",
    [slug]
  );
  if (!c) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const products = await dbAll(
    env.DB,
    "SELECT p.name, p.slug, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, o.name as operator_name, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id WHERE p.country_iso2=? AND p.status='published' AND o.status='published' ORDER BY p.price_amount ASC LIMIT 100",
    [c.iso2]
  );
  const ogImage = c.hero_image_key ? mediaUrl(env.APP_ORIGIN, c.hero_image_key) : void 0;
  const canonical = new URL(`/country/${c.slug}`, env.APP_ORIGIN).toString();
  const content = c.content_html ?? `<p>${escapeHtml(pick(locale, `\u5728 ${c.name} \u4F7F\u7528 eSIM \u4E0A\u7F51\uFF0C\u652F\u6301\u65C5\u884C\u4E0E\u5546\u52A1\u573A\u666F\u3002`, `Use eSIM in ${c.name} for travel and business scenarios.`))}</p>`;
  const desc = c.seo_description ?? autoDescription(content);
  const faq = safeJson(c.faq_json);
  const jsonLd = [];
  if (Array.isArray(faq) && faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq
    });
  }
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, "\u9996\u9875", "Home"))}</a> / ${escapeHtml(c.name)}</small></nav>
    <h1>${escapeHtml(c.name)} eSIM</h1>
    ${c.hero_image_key ? `<img src="${escapeHtml(ogImage ?? "")}" alt="${escapeHtml(c.name)} eSIM" loading="lazy" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;border:1px solid var(--b)" />` : ""}
    <section class="card" aria-label="Guide">${content}</section>
    <h2>${escapeHtml(pick(locale, "\u63A8\u8350\u5957\u9910", "Recommended Plans"))}</h2>
    <div class="card" aria-label="Products">
      <table>
        <thead><tr><th>${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546", "Operator"))}</th><th>${escapeHtml(pick(locale, "\u5957\u9910", "Plan"))}</th><th>${escapeHtml(pick(locale, "\u5929\u6570", "Days"))}</th><th>${escapeHtml(pick(locale, "\u6D41\u91CF", "Data"))}</th><th>${escapeHtml(pick(locale, "\u70ED\u70B9", "Hotspot"))}</th><th>${escapeHtml(pick(locale, "\u4EF7\u683C", "Price"))}</th><th></th></tr></thead>
        <tbody>
          ${products.map((p) => {
    const data = p.is_unlimited ? pick(locale, "\u65E0\u9650", "Unlimited") : p.data_gb ? `${p.data_gb}GB` : "\u2014";
    const hotspot = p.supports_hotspot ? pick(locale, "\u652F\u6301", "Supported") : pick(locale, "\u4E0D\u652F\u6301", "Not supported");
    const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`;
    return `<tr>
                <td><a href="/operator/${escapeHtml(p.operator_slug)}">${escapeHtml(p.operator_name)}</a></td>
                <td>${escapeHtml(p.name)}</td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(hotspot)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, "\u53BB\u8D2D\u4E70", "Buy now"))}</a></td>
              </tr>`;
  }).join("")}
        </tbody>
      </table>
    </div>
  </main>
  <footer><small>${escapeHtml(pick(locale, "\u4EF7\u683C\u4E0E\u8986\u76D6\u8303\u56F4\u4EE5\u4F9B\u5E94\u5546\u9875\u9762\u4E3A\u51C6\u3002", "Final prices and coverage are subject to operator pages."))}</small></footer>
  `;
  return html(
    layout(
      {
        title: c.seo_title ?? `${c.name} eSIM \u5957\u9910\u4E0E\u4F9B\u5E94\u5546\u5BF9\u6BD4 | ${env.SITE_NAME}`,
        description: pick(locale, desc, autoDescription(content)),
        canonical,
        ogImage,
        locale: locale === "zh" ? "zh-CN" : "en",
        jsonLd
      },
      body,
      criticalCss()
    ),
    {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600"
      }
    }
  );
}
async function operatorPage(env, req, slug) {
  const locale = resolveLocale(req);
  const o = await dbGet(
    env.DB,
    "SELECT name, slug, website_url, seo_title, seo_description, content_html, logo_image_key, faq_json FROM operators WHERE slug=? AND status='published'",
    [slug]
  );
  if (!o) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const products = await dbAll(
    env.DB,
    "SELECT slug, name, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, country_iso2 FROM products WHERE operator_id=(SELECT id FROM operators WHERE slug=?) AND status='published' ORDER BY price_amount ASC LIMIT 200",
    [slug]
  );
  const ogImage = o.logo_image_key ? mediaUrl(env.APP_ORIGIN, o.logo_image_key) : void 0;
  const canonical = new URL(`/operator/${o.slug}`, env.APP_ORIGIN).toString();
  const content = o.content_html ?? `<p>${escapeHtml(pick(locale, `${o.name} \u63D0\u4F9B\u8986\u76D6\u591A\u4E2A\u56FD\u5BB6/\u5730\u533A\u7684 eSIM \u5957\u9910\u3002`, `${o.name} offers eSIM plans covering multiple countries and regions.`))}</p>`;
  const desc = o.seo_description ?? autoDescription(content);
  const faq = safeJson(o.faq_json);
  const uniqueCountries = new Set(products.map((p) => p.country_iso2.toUpperCase()));
  const minPrice = products.length > 0 ? `${products[0].price_currency} ${products[0].price_amount.toFixed(2)}` : pick(locale, "\u6682\u65E0\u5957\u9910", "No plans yet");
  const networkTags = Array.from(new Set(products.map((p) => p.network_type ?? "4G/5G").filter(Boolean))).slice(0, 4);
  const jsonLd = [];
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    url: o.website_url
  });
  if (Array.isArray(faq) && faq.length > 0) {
    jsonLd.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq });
  }
  const body = `
  ${publicHeader(env, req, locale, [
    { href: "/posts", label: pick(locale, "SIM\u5361\u8D44\u8BAF", "SIM Card News") }
  ])}
  <main>
    <section class="hero" aria-label="Provider Hero">
      <div class="card">
        <nav aria-label="Breadcrumb"><small><a href="/">${escapeHtml(pick(locale, "\u9996\u9875", "Home"))}</a> / ${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546", "Operator"))} / ${escapeHtml(o.name)}</small></nav>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:8px 0 14px">
          ${ogImage ? `<img src="${escapeHtml(ogImage)}" alt="${escapeHtml(o.name)} logo" width="72" height="72" loading="lazy" class="inline-media" />` : ""}
          <div>
            <span class="eyebrow">${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546\u76EE\u5F55", "Operator Directory"))}</span>
            <h1>${escapeHtml(o.name)} eSIM ${escapeHtml(pick(locale, "\u5957\u9910", "Plans"))}</h1>
            <p>${escapeHtml(pick(locale, `\u67E5\u770B ${o.name} \u7684\u5957\u9910\u4EF7\u683C\u3001\u8986\u76D6\u56FD\u5BB6\u3001\u7F51\u7EDC\u7C7B\u578B\u4E0E\u8D2D\u4E70\u5165\u53E3\uFF0C\u98CE\u683C\u4E0E\u9996\u9875\u4FDD\u6301\u4E00\u81F4\u7684\u5361\u7247\u5F0F\u76EE\u5F55\u4F53\u9A8C\u3002`, `Review ${o.name} plan pricing, coverage, network type, and purchase links in a layout aligned with the homepage.`))}</p>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat"><small>${escapeHtml(pick(locale, "\u5DF2\u53D1\u5E03\u5957\u9910", "Published plans"))}</small><strong>${products.length}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, "\u8986\u76D6\u56FD\u5BB6", "Countries covered"))}</small><strong>${uniqueCountries.size}</strong></div>
          <div class="stat"><small>${escapeHtml(pick(locale, "\u6700\u4F4E\u4EF7\u683C", "Lowest price"))}</small><strong>${escapeHtml(minPrice)}</strong></div>
        </div>
      </div>
      <aside class="card muted-panel">
        <h2>${escapeHtml(pick(locale, "\u5FEB\u901F\u64CD\u4F5C", "Quick Actions"))}</h2>
        <div class="meta-list">
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, "\u5B98\u7F51\u5165\u53E3", "Official site"))}</small>
            <a class="btn primary" href="${escapeHtml(o.website_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, "\u8BBF\u95EE\u5B98\u7F51", "Visit website"))}</a>
          </div>
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, "\u8986\u76D6\u7F51\u7EDC", "Network types"))}</small>
            <div class="badge-list">
              ${networkTags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("") || `<span class="badge">${escapeHtml(pick(locale, "\u5957\u9910\u5F85\u8865\u5145", "Plans coming soon"))}</span>`}
            </div>
          </div>
          <div class="meta-item">
            <small>${escapeHtml(pick(locale, "\u5916\u94FE\u8BF4\u660E", "External link notice"))}</small>
            <p>${escapeHtml(pick(locale, "\u4EF7\u683C\u4E0E\u5E93\u5B58\u4EE5\u4F9B\u5E94\u5546\u5B98\u7F51\u4E3A\u51C6\uFF0C\u8D2D\u4E70\u9875\u5C06\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u3002", "Pricing and stock depend on the operator website. Purchase links open in a new tab."))}</p>
          </div>
        </div>
      </aside>
    </section>
    <section class="detail-layout">
      <div class="section-gap">
        <section class="card content-prose" aria-label="Content">
          <h2>${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546\u4ECB\u7ECD", "About the operator"))}</h2>
          ${content}
        </section>
        <section class="card" aria-label="Price table">
          <h2>${escapeHtml(pick(locale, "\u4EF7\u683C\u8868", "Pricing"))}</h2>
          <div class="table-wrap">
          <table>
        <thead><tr><th>${escapeHtml(pick(locale, "\u5957\u9910", "Plan"))}</th><th>${escapeHtml(pick(locale, "\u56FD\u5BB6", "Country"))}</th><th>${escapeHtml(pick(locale, "\u5929\u6570", "Days"))}</th><th>${escapeHtml(pick(locale, "\u6D41\u91CF", "Data"))}</th><th>${escapeHtml(pick(locale, "\u7F51\u7EDC", "Network"))}</th><th>${escapeHtml(pick(locale, "\u4EF7\u683C", "Price"))}</th><th></th></tr></thead>
        <tbody>
          ${products.map((p) => {
    const data = p.is_unlimited ? pick(locale, "\u65E0\u9650", "Unlimited") : p.data_gb ? `${p.data_gb}GB` : "\u2014";
    const net = p.network_type ?? "\u2014";
    const price = `${p.price_currency} ${p.price_amount.toFixed(2)}`;
    return `<tr>
                <td><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a></td>
                <td>${escapeHtml(p.country_iso2.toUpperCase())}</td>
                <td>${p.days}</td>
                <td>${escapeHtml(data)}</td>
                <td>${escapeHtml(net)}</td>
                <td>${escapeHtml(price)}</td>
                <td><a class="btn primary" href="${escapeHtml(p.purchase_url)}" rel="nofollow noopener" target="_blank">${escapeHtml(pick(locale, "\u53BB\u8D2D\u4E70", "Buy now"))}</a></td>
              </tr>`;
  }).join("")}
        </tbody>
      </table>
          </div>
        </section>
        ${Array.isArray(faq) && faq.length > 0 ? `<section class="card" aria-label="FAQ"><h2>${escapeHtml(pick(locale, "\u5E38\u89C1\u95EE\u9898", "FAQ"))}</h2><div class="faq-list">${faq.map((item) => {
    const q = typeof item === "object" && item && "name" in item ? String(item.name ?? "") : "";
    const accepted = typeof item === "object" && item && "acceptedAnswer" in item ? item.acceptedAnswer : null;
    const a = typeof accepted === "object" && accepted && "text" in accepted ? String(accepted.text ?? "") : "";
    return `<article class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></article>`;
  }).join("")}</div></section>` : ""}
      </div>
      <aside class="section-gap">
        <section class="soft-card">
          <h3>${escapeHtml(pick(locale, "\u76EE\u5F55\u6458\u8981", "Directory Summary"))}</h3>
          <div class="meta-list">
            <div class="meta-item"><small>${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546\u540D\u79F0", "Operator"))}</small><strong>${escapeHtml(o.name)}</strong></div>
            <div class="meta-item"><small>${escapeHtml(pick(locale, "\u8986\u76D6\u56FD\u5BB6", "Countries covered"))}</small><strong>${uniqueCountries.size} ${escapeHtml(pick(locale, "\u4E2A", "countries"))}</strong></div>
            <div class="meta-item"><small>${escapeHtml(pick(locale, "\u5957\u9910\u66F4\u65B0", "Sort order"))}</small><strong>${escapeHtml(pick(locale, "\u6309\u4EF7\u683C\u5347\u5E8F\u5C55\u793A", "Ordered by ascending price"))}</strong></div>
          </div>
        </section>
        <section class="soft-card">
          <h3>${escapeHtml(pick(locale, "\u63A8\u8350\u6D4F\u89C8", "Recommended next steps"))}</h3>
          <div class="meta-list">
            <a class="btn" href="/search?q=${encodeURIComponent(o.name)}">${escapeHtml(pick(locale, "\u641C\u7D22\u540C\u540D\u5957\u9910", "Search matching plans"))}</a>
            <a class="btn" href="/posts">${escapeHtml(pick(locale, "\u67E5\u770B SIM\u5361\u8D44\u8BAF", "Read SIM card news"))}</a>
          </div>
        </section>
      </aside>
    </section>
  </main>
  <footer><small>${escapeHtml(pick(locale, "\u672C\u7AD9\u4E0D\u76F4\u63A5\u9500\u552E eSIM\u3002", "This site does not directly sell eSIMs."))}</small></footer>
  `;
  return html(
    layout(
      {
        title: o.seo_title ?? `${o.name} eSIM \u5957\u9910\u4E0E\u8986\u76D6\u56FD\u5BB6 | ${env.SITE_NAME}`,
        description: pick(locale, desc, autoDescription(content)),
        canonical,
        ogImage,
        locale: locale === "zh" ? "zh-CN" : "en",
        jsonLd
      },
      body,
      criticalCss()
    ),
    {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600"
      }
    }
  );
}
function safeJson(input) {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

// src/lib/ids.ts
function ulid() {
  const t = Date.now().toString(36).padStart(10, "0");
  const r = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  for (const b of r) s += b.toString(16).padStart(2, "0");
  return `01${t}${s}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}

// src/lib/jwt.ts
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlJson(obj) {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}
function b64urlToBytes(s) {
  const p = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(p);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmacSha256(key, data) {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}
async function signJwt(secret, payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const p1 = b64urlJson(header);
  const p2 = b64urlJson(payload);
  const data = `${p1}.${p2}`;
  const sig = await hmacSha256(secret, data);
  return `${data}.${b64url(sig)}`;
}
async function verifyJwt(secret, token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [p1, p2, p3] = parts;
  const data = `${p1}.${p2}`;
  const sigBytes = b64urlToBytes(p3);
  const sig = sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength);
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify("HMAC", k, sig, new TextEncoder().encode(data));
  if (!ok) return null;
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p2)));
  if (typeof payload.exp !== "number" || payload.exp * 1e3 <= Date.now()) return null;
  return payload;
}

// src/lib/auth.ts
async function requireAdmin(env, req) {
  const secret = env.JWT_SECRET;
  if (!secret) return null;
  const cookies = getCookies(req);
  const token = cookies["access_token"];
  if (!token) return null;
  const payload = await verifyJwt(secret, token);
  if (!payload || payload.typ !== "access") return null;
  if (payload.iss !== env.JWT_ISSUER) return null;
  return { userId: payload.sub, role: payload.role ?? "admin" };
}
async function issueTokens(env, userId, role) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  const now = Math.floor(Date.now() / 1e3);
  const accessTtl = parseInt(env.ACCESS_TOKEN_TTL_SECONDS, 10);
  const refreshTtl = parseInt(env.REFRESH_TOKEN_TTL_SECONDS, 10);
  const access = await signJwt(secret, {
    iss: env.JWT_ISSUER,
    sub: userId,
    iat: now,
    exp: now + accessTtl,
    typ: "access",
    role
  });
  const refreshJti = ulid();
  const refresh = await signJwt(secret, {
    iss: env.JWT_ISSUER,
    sub: userId,
    iat: now,
    exp: now + refreshTtl,
    typ: "refresh",
    jti: refreshJti,
    role
  });
  await env.KV.put(`rt:${refreshJti}`, userId, { expirationTtl: refreshTtl });
  return { access, refresh, refreshJti };
}
function authCookies(tokens, secure) {
  const accessCookie = setCookie("access_token", tokens.access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60
  });
  const refreshCookie = setCookie("refresh_token", tokens.refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/admin/auth",
    maxAge: 60 * 60 * 24 * 30
  });
  return [accessCookie, refreshCookie];
}
function clearAuthCookies(secure) {
  return [
    setCookie("access_token", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 }),
    setCookie("refresh_token", "", { httpOnly: true, secure, sameSite: "lax", path: "/api/admin/auth", maxAge: 0 })
  ];
}
async function refreshTokens(env, req) {
  const secret = env.JWT_SECRET;
  if (!secret) return null;
  const cookies = getCookies(req);
  const rt = cookies["refresh_token"];
  if (!rt) return null;
  const payload = await verifyJwt(secret, rt);
  if (!payload || payload.typ !== "refresh" || !payload.jti) return null;
  if (payload.iss !== env.JWT_ISSUER) return null;
  const exists = await env.KV.get(`rt:${payload.jti}`);
  if (!exists || exists !== payload.sub) return null;
  await env.KV.delete(`rt:${payload.jti}`);
  const { access, refresh } = await issueTokens(env, payload.sub, payload.role ?? "admin");
  return { access, refresh };
}

// src/pages/admin.ts
init_password();
function adminHeader(env, req, locale, actions) {
  const current = new URL(req.url);
  const currentPath = `${current.pathname}${current.search}`;
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/">
        <span class="brand-badge">CMS</span>
        <span class="brand-copy">
          <strong>${escapeHtml(env.SITE_NAME)}</strong>
          <small>\u5185\u5BB9\u53D1\u5E03\u4E0E\u7D20\u6750\u7BA1\u7406\u540E\u53F0</small>
        </span>
      </a>
      <div class="nav-links">
        <a class="nav-link" href="/admin">${escapeHtml(pick(locale, "\u6982\u89C8", "Overview"))}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml(pick(locale, "\u56FD\u5BB6", "Countries"))}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546", "Operators"))}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml(pick(locale, "\u5957\u9910", "Products"))}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml(pick(locale, "\u6587\u7AE0", "Posts"))}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml(pick(locale, "\u5A92\u4F53", "Media"))}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml(pick(locale, "\u5BFC\u5165/\u5BFC\u51FA", "Import / Export"))}</a>
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === "zh" ? "primary" : ""}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref("zh", currentPath))}">\u4E2D\u6587</a>
        <a class="btn ${locale === "en" ? "primary" : ""}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref("en", currentPath))}">EN</a>
        ${actions}
      </div>
    </nav>
  </header>`;
}
function statusLabel(status) {
  const map = {
    draft: "\u8349\u7A3F",
    scheduled: "\u5B9A\u65F6\u53D1\u5E03",
    published: "\u5DF2\u53D1\u5E03",
    archived: "\u5DF2\u5F52\u6863"
  };
  return map[status] ?? status;
}
function localeLabel2(locale) {
  const value = (locale ?? "").toLowerCase();
  if (value === "zh" || value === "zh-cn" || value === "zh-hans") return "\u4E2D\u6587";
  if (value === "en" || value === "en-us" || value === "en-gb") return "English";
  return locale || "\u672A\u8BBE\u7F6E";
}
async function adminLoginPage(env, req) {
  const locale = resolveLocale(req);
  const canonical = new URL("/admin/login", env.APP_ORIGIN).toString();
  const body = `
  ${adminHeader(env, req, locale, `<a class="btn" href="/">${escapeHtml(pick(locale, "\u8FD4\u56DE\u524D\u53F0", "Back to site"))}</a>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Admin</span>
      <div>
        <h1>${escapeHtml(pick(locale, "\u767B\u5F55\u7BA1\u7406\u540E\u53F0", "Sign in to admin"))}</h1>
        <p>${escapeHtml(pick(locale, "\u7EDF\u4E00\u7BA1\u7406\u56FD\u5BB6\u9875\u3001\u4F9B\u5E94\u5546\u3001\u5957\u9910\u3001\u6587\u7AE0\u548C\u5A92\u4F53\u8D44\u6E90\u3002", "Manage country pages, operators, products, posts, and media in one place."))}</p>
      </div>
    </section>
    <section class="card muted-panel" style="max-width:520px;margin:0 auto">
      <form method="POST" action="/api/admin/auth/login">
        <label><small>${escapeHtml(pick(locale, "\u90AE\u7BB1", "Email"))}</small><input class="input" type="email" name="email" required></label>
        <div style="height:8px"></div>
        <label><small>${escapeHtml(pick(locale, "\u5BC6\u7801", "Password"))}</small><input class="input" type="password" name="password" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">${escapeHtml(pick(locale, "\u767B\u5F55", "Sign in"))}</button>
      </form>
    </section>
  </main>
  <footer><small>${escapeHtml(pick(locale, "\u4EC5\u9650\u7F16\u8F91/\u7BA1\u7406\u5458\u4F7F\u7528\u3002", "Editors and administrators only."))}</small></footer>
  `;
  return html(
    layout(
      {
        title: pick(locale, `\u767B\u5F55\u7BA1\u7406\u540E\u53F0 | ${env.SITE_NAME}`, `Admin Login | ${env.SITE_NAME}`),
        description: pick(locale, "\u4EC5\u9650\u7F16\u8F91/\u7BA1\u7406\u5458\u4F7F\u7528\u3002", "Editors and administrators only."),
        canonical,
        locale: locale === "zh" ? "zh-CN" : "en",
        robots: "noindex, nofollow"
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminHomePage(env, req) {
  const locale = resolveLocale(req);
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const canonical = new URL("/admin", env.APP_ORIGIN).toString();
  const [countries, operators, products, posts, categories, postLocales] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM countries").first(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM operators").first(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM products").first(),
    env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) as archived FROM posts").first(),
    env.DB.prepare("SELECT COUNT(*) as total FROM categories").first(),
    env.DB.prepare("SELECT locale, COUNT(*) as total FROM posts GROUP BY locale ORDER BY total DESC").all()
  ]);
  const body = `
  ${adminHeader(env, req, locale, `<form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">${escapeHtml(pick(locale, "\u9000\u51FA", "Sign out"))}</button></form>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Dashboard</span>
      <div>
        <h1>${escapeHtml(pick(locale, "\u7AD9\u70B9\u6536\u5F55\u4E0E\u53D1\u5E03\u6982\u89C8", "Site inventory & publishing overview"))}</h1>
        <p>${escapeHtml(pick(locale, "\u5DF2\u767B\u5F55\uFF1A", "Signed in as:"))}<strong>${escapeHtml(user.userId)}</strong>${escapeHtml(pick(locale, "\u3002\u8FD9\u91CC\u5C55\u793A\u5F53\u524D\u7F51\u7AD9\u5DF2\u6536\u5F55\u6761\u76EE\u3001\u53D1\u5E03\u72B6\u6001\u4E0E\u6587\u7AE0\u8BED\u8A00\u5206\u5E03\u3002", ". This dashboard shows indexed items, publishing states, and post language distribution."))}</p>
      </div>
    </section>
    <section class="card">
      <h2>\u6838\u5FC3\u6536\u5F55\u6570\u636E</h2>
      <div class="card-grid">
        <article class="card muted-panel"><h3>\u56FD\u5BB6</h3><p>\u603B\u6570 <strong>${countries?.total ?? 0}</strong></p><small>\u5DF2\u53D1\u5E03 ${countries?.published ?? 0} / \u8349\u7A3F ${countries?.draft ?? 0}</small></article>
        <article class="card muted-panel"><h3>\u4F9B\u5E94\u5546</h3><p>\u603B\u6570 <strong>${operators?.total ?? 0}</strong></p><small>\u5DF2\u53D1\u5E03 ${operators?.published ?? 0} / \u8349\u7A3F ${operators?.draft ?? 0}</small></article>
        <article class="card muted-panel"><h3>\u5957\u9910</h3><p>\u603B\u6570 <strong>${products?.total ?? 0}</strong></p><small>\u5DF2\u53D1\u5E03 ${products?.published ?? 0} / \u8349\u7A3F ${products?.draft ?? 0}</small></article>
        <article class="card muted-panel"><h3>\u6587\u7AE0</h3><p>\u603B\u6570 <strong>${posts?.total ?? 0}</strong></p><small>\u5DF2\u53D1\u5E03 ${posts?.published ?? 0} / \u8349\u7A3F ${posts?.draft ?? 0}</small></article>
        <article class="card muted-panel"><h3>\u6587\u7AE0\u5206\u7C7B</h3><p>\u603B\u6570 <strong>${categories?.total ?? 0}</strong></p><small>\u7528\u4E8E\u6587\u7AE0\u5F52\u7C7B\u4E0E\u524D\u53F0\u5185\u5BB9\u5BFC\u822A</small></article>
      </div>
    </section>
    <section class="split-grid">
      <section class="card">
        <h2>\u53D1\u5E03\u72B6\u6001</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>\u6A21\u5757</th><th>\u5DF2\u53D1\u5E03</th><th>\u5B9A\u65F6\u53D1\u5E03</th><th>\u8349\u7A3F</th><th>\u5DF2\u5F52\u6863</th></tr></thead>
            <tbody>
              <tr><td>\u56FD\u5BB6</td><td>${countries?.published ?? 0}</td><td>${countries?.scheduled ?? 0}</td><td>${countries?.draft ?? 0}</td><td>${countries?.archived ?? 0}</td></tr>
              <tr><td>\u4F9B\u5E94\u5546</td><td>${operators?.published ?? 0}</td><td>${operators?.scheduled ?? 0}</td><td>${operators?.draft ?? 0}</td><td>${operators?.archived ?? 0}</td></tr>
              <tr><td>\u5957\u9910</td><td>${products?.published ?? 0}</td><td>${products?.scheduled ?? 0}</td><td>${products?.draft ?? 0}</td><td>${products?.archived ?? 0}</td></tr>
              <tr><td>\u6587\u7AE0</td><td>${posts?.published ?? 0}</td><td>${posts?.scheduled ?? 0}</td><td>${posts?.draft ?? 0}</td><td>${posts?.archived ?? 0}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="card">
        <h2>\u6587\u7AE0\u8BED\u8A00\u5206\u5E03</h2>
        <div class="chip-row">
          ${(postLocales.results ?? []).map((row) => `<span class="btn">${escapeHtml(localeLabel2(row.locale))} ${escapeHtml(String(row.total))}</span>`).join("") || "<small>\u6682\u65E0\u6587\u7AE0\u6570\u636E</small>"}
        </div>
        <div style="height:12px"></div>
        <p>${escapeHtml(pick(locale, "\u5EFA\u8BAE\u6587\u7AE0\u81F3\u5C11\u8986\u76D6\u4E2D\u6587\u4E0E English \u4E24\u4E2A\u7248\u672C\uFF0C\u5E76\u5728\u540E\u53F0\u901A\u8FC7\u8BED\u8A00\u4EE3\u7801\u8FDB\u884C\u7B5B\u9009\u548C\u7EF4\u62A4\u3002", "Keep both Chinese and English versions whenever possible, and use language filters in admin to maintain them."))}</p>
      </section>
    </section>
    <section class="card">
      <h2>${escapeHtml(pick(locale, "\u5FEB\u6377\u5165\u53E3", "Quick Actions"))}</h2>
      <div class="admin-actions">
        <a class="btn" href="/admin/countries">\u7BA1\u7406\u56FD\u5BB6\u9875</a>
        <a class="btn" href="/admin/operators">\u7BA1\u7406\u4F9B\u5E94\u5546</a>
        <a class="btn" href="/admin/products">\u7BA1\u7406\u5957\u9910</a>
        <a class="btn" href="/admin/posts">\u7BA1\u7406\u6587\u7AE0</a>
        <a class="btn" href="/admin/categories">\u7BA1\u7406\u6587\u7AE0\u5206\u7C7B</a>
        <a class="btn" href="/admin/import-export">\u5BFC\u5165/\u5BFC\u51FA</a>
      </div>
    </section>
  </main>
  `;
  return html(
    layout(
      {
        title: `\u5185\u5BB9\u7BA1\u7406\u53F0 | ${env.SITE_NAME}`,
        description: "\u7BA1\u7406\u4F9B\u5E94\u5546\u3001\u5957\u9910\u3001\u56FD\u5BB6SEO\u9875\u4E0E\u53D1\u5E03\u3002",
        canonical,
        robots: "noindex, nofollow"
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminListPage(env, req, entity) {
  const locale = resolveLocale(req);
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const canonical = new URL(`/admin/${entity}`, env.APP_ORIGIN).toString();
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") ?? "").trim().toLowerCase();
  const rows = await dbAll(env.DB, listSql(entity, lang), lang && entity === "posts" ? [lang] : []);
  const titleMap = {
    categories: "\u6587\u7AE0\u5206\u7C7B",
    countries: "\u56FD\u5BB6",
    operators: "\u4F9B\u5E94\u5546",
    products: "\u5957\u9910",
    posts: "\u6587\u7AE0"
  };
  const body = `
  ${adminHeader(env, req, locale, `<a class="btn primary" href="/admin/${entity}/new">${escapeHtml(pick(locale, "\u65B0\u589E", "Create"))}</a>`)}
  <main>
    <section class="page-header">
      <span class="eyebrow">Admin List</span>
      <div>
        <h1>${escapeHtml(titleMap[entity])}${escapeHtml(pick(locale, "\u5217\u8868", " List"))}</h1>
        <p>${escapeHtml(pick(locale, "\u96C6\u4E2D\u67E5\u770B\u6700\u8FD1\u66F4\u65B0\u7684\u5185\u5BB9\u8BB0\u5F55\uFF0C\u5E76\u8FDB\u5165\u7F16\u8F91\u9875\u7EE7\u7EED\u7EF4\u62A4\u3002", "Review recently updated records and continue editing from here."))}</p>
      </div>
    </section>
    ${entity === "posts" ? `<section class="card muted-panel"><h2>${escapeHtml(pick(locale, "\u6587\u7AE0\u6A21\u5757", "Post Module"))}</h2><div class="admin-actions"><a class="btn" href="/admin/posts">${escapeHtml(pick(locale, "\u5168\u90E8\u6587\u7AE0", "All posts"))}</a><a class="btn ${lang === "zh" || lang === "zh-cn" ? "primary" : ""}" href="/admin/posts?lang=zh">${escapeHtml(pick(locale, "\u4E2D\u6587\u6587\u7AE0", "Chinese posts"))}</a><a class="btn ${lang === "en" ? "primary" : ""}" href="/admin/posts?lang=en">English Posts</a><a class="btn" href="/admin/categories">${escapeHtml(pick(locale, "\u7BA1\u7406\u6587\u7AE0\u5206\u7C7B", "Manage categories"))}</a><a class="btn primary" href="/admin/posts/new">${escapeHtml(pick(locale, "\u65B0\u589E\u6587\u7AE0", "New post"))}</a></div></section>` : ""}
    <section class="card">
      <div class="table-wrap">
      <table>
        <thead>${entity === "posts" ? "<tr><th>slug</th><th>\u6807\u9898</th><th>\u8BED\u8A00</th><th>\u5206\u7C7B</th><th>\u72B6\u6001</th><th>\u66F4\u65B0\u65F6\u95F4</th><th></th></tr>" : "<tr><th>slug</th><th>name</th><th>status</th><th>updated</th><th></th></tr>"}</thead>
        <tbody>
          ${rows.map((r) => {
    const slug = String(r.slug ?? "");
    const name = String(r.name ?? r.title ?? "");
    const status = String(r.status ?? "");
    const updated = String(r.updated_at ?? "");
    if (entity === "posts") {
      const locale2 = String(r.locale ?? "");
      const category = String(r.category_name ?? "");
      return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(localeLabel2(locale2))}</td><td>${escapeHtml(category || "\u672A\u5206\u7C7B")}</td><td>${escapeHtml(statusLabel(status))}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">\u7F16\u8F91</a></td></tr>`;
    }
    return `<tr><td>${escapeHtml(slug)}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(status ? statusLabel(status) : "\u2014")}</td><td><small>${escapeHtml(updated)}</small></td><td><a class="btn" href="/admin/${entity}/${escapeHtml(String(r.id))}">\u7F16\u8F91</a></td></tr>`;
  }).join("")}
        </tbody>
      </table>
      </div>
    </section>
  </main>
  `;
  return html(
    layout(
      {
        title: pick(locale, `${titleMap[entity]}\u7BA1\u7406 | ${env.SITE_NAME}`, `${titleMap[entity]} | ${env.SITE_NAME}`),
        description: autoDescription("\u5185\u5BB9\u7BA1\u7406\u5217\u8868"),
        canonical,
        locale: locale === "zh" ? "zh-CN" : "en",
        robots: "noindex, nofollow"
      },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
function listSql(entity, lang) {
  if (entity === "posts") {
    const where = lang ? "WHERE lower(p.locale)=?" : "";
    return `SELECT p.id, p.slug, p.title as name, p.locale, p.status, p.updated_at, c.name as category_name FROM posts p LEFT JOIN categories c ON c.id=p.category_id ${where} ORDER BY p.updated_at DESC LIMIT 200`;
  }
  if (entity === "categories") return `SELECT id, slug, name, '' as status, updated_at FROM categories ORDER BY updated_at DESC LIMIT 500`;
  return `SELECT id, slug, name, status, updated_at FROM ${entity} ORDER BY updated_at DESC LIMIT 200`;
}
async function apiAdminLogin(env, req) {
  const isLocal = new URL(req.url).hostname === "localhost";
  const secure = !isLocal;
  const form = await req.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return badRequest("Missing credentials");
  const user = await env.DB.prepare("SELECT id,email,password_hash,role FROM admin_users WHERE email=?").bind(email).first();
  if (!user) return unauthorized("Invalid credentials");
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return unauthorized("Invalid credentials");
  const tokens = await issueTokens(env, user.id, user.role);
  const cookies = authCookies({ access: tokens.access, refresh: tokens.refresh }, secure);
  const headers = new Headers({ Location: "/admin" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers });
}
async function apiAdminLogout(env, req) {
  const isLocal = new URL(req.url).hostname === "localhost";
  const secure = !isLocal;
  const headers = new Headers({ Location: "/admin/login" });
  for (const c of clearAuthCookies(secure)) headers.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers });
}
async function apiAdminRefresh(env, req) {
  const isLocal = new URL(req.url).hostname === "localhost";
  const secure = !isLocal;
  const next = await refreshTokens(env, req);
  if (!next) return unauthorized("Refresh failed");
  const headers = new Headers();
  for (const c of authCookies(next, secure)) headers.append("Set-Cookie", c);
  return json({ ok: true }, { headers });
}

// src/pages/system.ts
async function robotsTxt(env) {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Sitemap: ${new URL("/sitemap.xml", env.APP_ORIGIN).toString()}
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
async function sitemapXml(env) {
  const [countries, operators, products, posts, categories] = await Promise.all([
    env.DB.prepare("SELECT slug, updated_at FROM countries WHERE status='published' ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT slug, updated_at FROM operators WHERE status='published' ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT slug, updated_at FROM products WHERE status='published' ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT slug, updated_at FROM posts WHERE status='published' ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT DISTINCT c.slug as slug, MAX(p.updated_at) as updated_at FROM categories c JOIN posts p ON p.category_id=c.id AND p.status='published' GROUP BY c.id, c.slug ORDER BY MAX(p.updated_at) DESC").all()
  ]);
  const origin = env.APP_ORIGIN;
  const urls = [];
  urls.push({ loc: new URL("/", origin).toString() });
  urls.push({ loc: new URL("/posts", origin).toString() });
  for (const c of categories.results ?? []) urls.push({ loc: new URL(`/posts/category/${c.slug}`, origin).toString(), lastmod: c.updated_at });
  for (const c of countries.results ?? []) urls.push({ loc: new URL(`/country/${c.slug}`, origin).toString(), lastmod: c.updated_at });
  for (const o of operators.results ?? []) urls.push({ loc: new URL(`/operator/${o.slug}`, origin).toString(), lastmod: o.updated_at });
  for (const p of products.results ?? []) urls.push({ loc: new URL(`/product/${p.slug}`, origin).toString(), lastmod: p.updated_at });
  for (const p of posts.results ?? []) urls.push({ loc: new URL(`/post/${p.slug}`, origin).toString(), lastmod: p.updated_at });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : "";
    return `<url><loc>${escapeXml(u.loc)}</loc>${lastmod}</url>`;
  }).join("")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=1800"
    }
  });
}
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// src/pages/api-public.ts
async function apiPublicCountry(env, slug) {
  const row = await dbGet(
    env.DB,
    "SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, updated_at FROM countries WHERE slug=? AND status='published'",
    [slug]
  );
  if (!row) return json({ error: "Not Found" }, { status: 404 });
  return json(row, { headers: { "Cache-Control": "public, max-age=120" } });
}
async function apiPublicOperator(env, slug) {
  const row = await dbGet(
    env.DB,
    "SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, updated_at FROM operators WHERE slug=? AND status='published'",
    [slug]
  );
  if (!row) return json({ error: "Not Found" }, { status: 404 });
  return json(row, { headers: { "Cache-Control": "public, max-age=120" } });
}
async function apiPublicSearch(env, req) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const country = (url.searchParams.get("country") ?? "").trim().toLowerCase();
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 20);
  const offset = clampInt(url.searchParams.get("offset"), 0, 5e3, 0);
  const qLike = q ? `%${q}%` : null;
  const [countries, operators, products] = await Promise.all([
    qLike ? dbAll(
      env.DB,
      "SELECT name, slug, iso2 FROM countries WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ? OR lower(iso2) LIKE ?) ORDER BY name ASC LIMIT 12",
      [qLike, qLike, qLike]
    ) : Promise.resolve([]),
    qLike ? dbAll(
      env.DB,
      "SELECT name, slug, logo_image_key FROM operators WHERE status='published' AND (lower(name) LIKE ? OR lower(slug) LIKE ?) ORDER BY updated_at DESC LIMIT 12",
      [qLike, qLike]
    ) : Promise.resolve([]),
    (() => {
      const where = ["p.status='published'", "o.status='published'", "c.status='published'"];
      const params = [];
      if (country) {
        where.push("p.country_iso2=?");
        params.push(country);
      }
      if (qLike) {
        where.push("(lower(p.name) LIKE ? OR lower(o.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.slug) LIKE ? OR lower(c.iso2) LIKE ?)");
        params.push(qLike, qLike, qLike, qLike, qLike);
      }
      params.push(limit, offset);
      const sql = `SELECT p.slug, p.name, p.days, p.data_gb, p.is_unlimited, p.supports_hotspot, p.network_type, p.price_amount, p.price_currency, p.purchase_url, p.country_iso2, o.name as operator_name, o.slug as operator_slug FROM products p JOIN operators o ON o.id=p.operator_id JOIN countries c ON c.iso2=p.country_iso2 WHERE ${where.join(" AND ")} ORDER BY p.price_amount ASC LIMIT ? OFFSET ?`;
      return dbAll(env.DB, sql, params);
    })()
  ]);
  return json(
    {
      query: { q: q || null, country: country || null, limit, offset },
      countries,
      operators,
      products,
      results: products
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
function clampInt(input, min, max, fallback) {
  const n = parseInt(input ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// src/pages/api-admin-media.ts
async function apiAdminUpload(env, req) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Missing file");
  if (file.size <= 0) return badRequest("Empty file");
  if (file.size > 8 * 1024 * 1024) return badRequest("File too large");
  const contentType = file.type || "application/octet-stream";
  const ext = guessExt(file.name, contentType);
  const key = `uploads/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${ulid()}${ext}`;
  const buf = await file.arrayBuffer();
  await putObject(env, key, buf, contentType);
  return json({ ok: true, key, url: mediaUrl(env.APP_ORIGIN, key) });
}
function guessExt(name, contentType) {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (ext && ext.length <= 8) return ext;
  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/svg+xml") return ".svg";
  return "";
}

// src/pages/admin-edit.ts
function adminNav(env, req, locale) {
  const current = new URL(req.url);
  const currentPath = `${current.pathname}${current.search}`;
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/">
        <span class="brand-badge">CMS</span>
        <span class="brand-copy">
          <strong>${escapeHtml(env.SITE_NAME)}</strong>
          <small>\u5185\u5BB9\u53D1\u5E03\u4E0E\u7D20\u6750\u7BA1\u7406\u540E\u53F0</small>
        </span>
      </a>
      <div class="nav-links">
        <a class="nav-link" href="/admin">${escapeHtml(pick(locale, "\u6982\u89C8", "Overview"))}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml(pick(locale, "\u56FD\u5BB6", "Countries"))}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546", "Operators"))}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml(pick(locale, "\u5957\u9910", "Products"))}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml(pick(locale, "\u6587\u7AE0", "Posts"))}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml(pick(locale, "\u5A92\u4F53", "Media"))}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml(pick(locale, "\u5BFC\u5165/\u5BFC\u51FA", "Import / Export"))}</a>
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === "zh" ? "primary" : ""}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref("zh", currentPath))}">\u4E2D\u6587</a>
        <a class="btn ${locale === "en" ? "primary" : ""}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref("en", currentPath))}">EN</a>
        <form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">\u9000\u51FA</button></form>
      </div>
    </nav>
  </header>`;
}
function statusOptions(selected) {
  const items = [
    ["draft", "\u8349\u7A3F"],
    ["scheduled", "\u5B9A\u65F6\u53D1\u5E03"],
    ["published", "\u5DF2\u53D1\u5E03"],
    ["archived", "\u5DF2\u5F52\u6863"]
  ];
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}
function localeOptions(selected) {
  const items = [
    ["zh", "\u4E2D\u6587"],
    ["en", "English"]
  ];
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)} (${escapeHtml(value)})</option>`).join("");
}
function sanitizeHtmlBasic(input) {
  const noScript = input.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  const noOnAttrs = noScript.replace(/\son\w+\s*=\s*"[^"]*"/gi, "").replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  const noJsHref = noOnAttrs.replace(/\shref\s*=\s*"\s*javascript:[^"]*"/gi, ' href="#"').replace(/\shref\s*=\s*'\s*javascript:[^']*'/gi, " href='#'");
  return noJsHref;
}
function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
async function ensureUniqueSlug(env, table, slug, entityId) {
  const row = await env.DB.prepare(`SELECT id FROM ${table} WHERE slug=? AND id<>? LIMIT 1`).bind(slug, entityId).first();
  if (row) throw new Error("Slug already exists");
}
async function ensureUniqueCountryIso2(env, iso2, entityId) {
  const row = await env.DB.prepare("SELECT id FROM countries WHERE iso2=? AND id<>? LIMIT 1").bind(iso2, entityId).first();
  if (row) throw new Error("ISO2 already exists");
}
async function ensureR2KeyExists(env, key) {
  const head = await env.R2.head(key);
  if (!head) throw new Error("R2 object not found");
}
async function ensureExists(env, sql, params, message) {
  const row = await env.DB.prepare(sql).bind(...params).first();
  if (!row) throw new Error(message);
}
function ensureJson(value, message) {
  if (!value.trim()) return;
  JSON.parse(value);
}
async function writeAudit(env, actorUserId, action, entityType, entityId, detail) {
  await env.DB.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, detail_json, created_at) VALUES (?,?,?,?,?,?,?)").bind(ulid(), actorUserId, action, entityType, entityId, JSON.stringify(detail ?? null), nowIso()).run();
}
function toPublishedAt(status, now) {
  if (status !== "published") return null;
  return now;
}
function parseIsoOrNull(s) {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid publish_at");
  return d.toISOString();
}
function editorBlock(field, label, value) {
  const id = `f_${field}`;
  const editorId = `e_${field}`;
  const toolbarId = `t_${field}`;
  return `
    <label><small>${escapeHtml(label)}</small></label>
    <div id="${escapeHtml(toolbarId)}" class="toolbar">
      <button class="btn" type="button" data-cmd="bold">B</button>
      <button class="btn" type="button" data-cmd="italic">I</button>
      <button class="btn" type="button" data-cmd="insertUnorderedList">\u2022 List</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h2">H2</button>
      <button class="btn" type="button" data-cmd="formatBlock" data-arg="h3">H3</button>
      <button class="btn" type="button" data-cmd="createLink">Link</button>
      <button class="btn" type="button" data-cmd="insertImage">Image</button>
    </div>
    <div id="${escapeHtml(editorId)}" contenteditable="true" class="input" style="min-height:220px;white-space:normal"></div>
    <textarea id="${escapeHtml(id)}" class="input" name="${escapeHtml(field)}" style="display:none" rows="10">${escapeHtml(value)}</textarea>
    <script>
      (() => {
        const editor = document.getElementById(${JSON.stringify(editorId)})
        const textarea = document.getElementById(${JSON.stringify(id)})
        const toolbar = document.getElementById(${JSON.stringify(toolbarId)})
        if (!(editor && textarea && toolbar)) return
        editor.innerHTML = textarea.value || ''
        const sync = () => { textarea.value = editor.innerHTML }
        editor.addEventListener('input', sync)
        toolbar.addEventListener('click', (e) => {
          const t = e.target
          if (!(t instanceof HTMLElement)) return
          const cmd = t.getAttribute('data-cmd')
          if (!cmd) return
          e.preventDefault()
          if (cmd === 'createLink') {
            const url = prompt('URL')
            if (!url) return
            document.execCommand('createLink', false, url)
            sync();
            return
          }
          if (cmd === 'insertImage') {
            const url = prompt('Image URL')
            if (!url) return
            document.execCommand('insertImage', false, url)
            sync();
            return
          }
          const arg = t.getAttribute('data-arg')
          document.execCommand(cmd, false, arg)
          sync()
        })
        const form = editor.closest('form')
        if (form) form.addEventListener('submit', sync)
      })()
    <\/script>
  `;
}
function jsonTextarea(field, label, value, rows) {
  return `<label><small>${escapeHtml(label)}</small><textarea class="input" name="${escapeHtml(field)}" rows="${rows}">${escapeHtml(value)}</textarea></label>`;
}
async function adminEditCategoryPage(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const isNew = !id;
  const row = isNew ? null : await dbGet(
    env.DB,
    "SELECT id, parent_id, name, slug, sort_order FROM categories WHERE id=?",
    [id]
  );
  if (!isNew && !row) return redirect("/admin/categories");
  const parents = await dbAll(env.DB, "SELECT id, name, slug FROM categories ORDER BY name ASC LIMIT 1000");
  const canonical = new URL(isNew ? "/admin/categories/new" : `/admin/categories/${id}`, env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const v = row ?? { id: "", parent_id: null, name: "", slug: "", sort_order: 0 };
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? "\u65B0\u589E\u5206\u7C7B" : "\u7F16\u8F91\u5206\u7C7B"}</h1>
    ${success ? `<section class="card notice success"><strong>\u4FDD\u5B58\u6210\u529F</strong><p>\u5206\u7C7B\u4FE1\u606F\u5DF2\u4FDD\u5B58\u3002</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4FDD\u5B58\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card">
      <form method="POST" action="${isNew ? "/admin/categories/new" : `/admin/categories/${escapeHtml(String(id))}`}">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>sort_order</small><input class="input" name="sort_order" type="number" value="${escapeHtml(String(v.sort_order ?? 0))}"></label>
          <label><small>parent</small>
            <select class="input" name="parent_id">
              <option value="">(\u65E0)</option>
              ${parents.filter((p) => isNew ? true : p.id !== id).map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === v.parent_id ? "selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(p.slug)})</option>`).join("")}
            </select>
          </label>
        </div>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4FDD\u5B58</button>
        <a class="btn" href="/admin/categories">\u8FD4\u56DE\u5217\u8868</a>
      </form>
    </section>
  </main>
  `;
  return html(
    layout({ title: `\u5206\u7C7B\u7F16\u8F91 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u7F16\u8F91", canonical, robots: "noindex, nofollow" }, body, criticalCss()),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminSaveCategory(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const entityId = id ?? ulid();
  const now = nowIso();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const sortOrder = parseInt(String(form.get("sort_order") ?? "0"), 10);
  const parentId = String(form.get("parent_id") ?? "").trim() || null;
  if (!name || !slug) return redirect(entityEditLocation("categories", id, entityId, "Missing fields"));
  if (!isValidSlug(slug)) return redirect(entityEditLocation("categories", id, entityId, "Invalid slug"));
  if (!Number.isFinite(sortOrder)) return redirect(entityEditLocation("categories", id, entityId, "Invalid sort_order"));
  const existing = await env.DB.prepare("SELECT id, parent_id, name, slug, sort_order FROM categories WHERE id=?").bind(entityId).first();
  if (existing) await writeRevision(env, user.userId, "categories", entityId, existing);
  try {
    await ensureUniqueSlug(env, "categories", slug, entityId);
  } catch (e) {
    return redirect(entityEditLocation("categories", id, entityId, e.message));
  }
  await env.DB.prepare(
    "INSERT INTO categories (id, parent_id, name, slug, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,name=excluded.name,slug=excluded.slug,sort_order=excluded.sort_order,updated_at=excluded.updated_at"
  ).bind(entityId, parentId, name, slug, sortOrder, now, now).run();
  await writeAudit(env, user.userId, id ? "update" : "create", "categories", entityId, { slug });
  return redirect(`/admin/categories/${entityId}?success=saved`);
}
async function writeRevision(env, actorUserId, entityType, entityId, snapshot) {
  const row = await env.DB.prepare("SELECT MAX(version) as v FROM revisions WHERE entity_type=? AND entity_id=?").bind(entityType, entityId).first();
  const nextVersion = (row?.v ?? 0) + 1;
  await env.DB.prepare(
    "INSERT INTO revisions (id, entity_type, entity_id, version, snapshot_json, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)"
  ).bind(ulid(), entityType, entityId, nextVersion, JSON.stringify(snapshot), actorUserId, nowIso()).run();
}
async function adminEditCountryPage(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const isNew = !id;
  const row = isNew ? null : await dbGet(
    env.DB,
    "SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM countries WHERE id=?",
    [id]
  );
  if (!isNew && !row) return redirect("/admin/countries");
  const canonical = new URL(isNew ? "/admin/countries/new" : `/admin/countries/${id}`, env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const uploaded = url.searchParams.get("uploaded");
  const v = row ?? {
    id: "",
    iso2: "",
    name: "",
    slug: "",
    hero_image_key: null,
    seo_title: "",
    seo_description: "",
    content_html: "",
    faq_json: "[]",
    status: "draft",
    publish_at: null
  };
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? "\u65B0\u589E\u56FD\u5BB6" : "\u7F16\u8F91\u56FD\u5BB6"}</h1>
    ${success ? `<section class="card notice success"><strong>\u4FDD\u5B58\u6210\u529F</strong><p>${escapeHtml(success === "saved_with_image" ? "\u56FD\u5BB6\u4FE1\u606F\u5DF2\u4FDD\u5B58\uFF0C\u5934\u56FE\u5DF2\u4E0A\u4F20\u5E76\u7ED1\u5B9A\u5230\u5F53\u524D\u8BB0\u5F55\u3002" : "\u56FD\u5BB6\u4FE1\u606F\u5DF2\u4FDD\u5B58\u3002")}</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4FDD\u5B58\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card">
      <form method="POST" action="${isNew ? "/admin/countries/new" : `/admin/countries/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>ISO2</small><input class="input" name="iso2" value="${escapeHtml(v.iso2)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601\uFF0C\u53EF\u7A7A)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? "")}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_hero_image_key" value="${escapeHtml(v.hero_image_key ?? "")}">
        <label><small>\u56FD\u5BB6\u5934\u56FE\u4E0A\u4F20\u5230 R2</small><input class="input" type="file" name="hero_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === "1" ? `<p><small class="hint-success">\u672C\u6B21\u5DF2\u4E0A\u4F20\u65B0\u7684\u56FD\u5BB6\u5934\u56FE\u3002</small></p>` : ""}
        ${v.hero_image_key ? `<div style="height:8px"></div><p><small>\u5F53\u524D R2 key\uFF1A</small> <code>${escapeHtml(v.hero_image_key)}</code></p>` : "<p><small>\u672A\u4E0A\u4F20\u5934\u56FE\uFF0C\u4FDD\u5B58\u65F6\u5982\u9009\u62E9\u56FE\u7247\u5C06\u81EA\u52A8\u751F\u6210 R2 key\u3002</small></p>"}
        <div style="height:8px"></div>
        <img id="country-hero-preview" src="${escapeHtml(v.hero_image_key ? mediaUrl(env.APP_ORIGIN, v.hero_image_key) : "")}" alt="${escapeHtml(v.name || v.slug)}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.hero_image_key ? "" : "display:none;"}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="hero_file"]')
            const preview = document.getElementById('country-hero-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              preview.src = URL.createObjectURL(file)
              preview.style.display = 'block'
            })
          })()
        <\/script>
        <div style="height:12px"></div>
        <label><small>seo_title</small><input class="input" name="seo_title" value="${escapeHtml(v.seo_title ?? "")}"></label>
        <div style="height:12px"></div>
        <label><small>seo_description</small><input class="input" name="seo_description" value="${escapeHtml(v.seo_description ?? "")}"></label>
        <div style="height:12px"></div>
        ${editorBlock("content_html", "content_html", v.content_html ?? "")}
        <div style="height:12px"></div>
        ${jsonTextarea("faq_json", "faq_json (FAQPage mainEntity \u6570\u7EC4 JSON)", v.faq_json ?? "[]", 6)}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4FDD\u5B58</button>
        <a class="btn" href="/admin/countries">\u8FD4\u56DE\u5217\u8868</a>
      </form>
    </section>
  </main>
  `;
  return html(
    layout(
      { title: `\u56FD\u5BB6\u7F16\u8F91 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u7F16\u8F91", canonical, robots: "noindex, nofollow" },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminSaveCountry(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const entityId = id ?? ulid();
  const now = nowIso();
  const iso2 = String(form.get("iso2") ?? "").toLowerCase().trim();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const status = String(form.get("status") ?? "draft").trim();
  const publishAt = String(form.get("publish_at") ?? "").trim() || null;
  const currentHero = String(form.get("current_hero_image_key") ?? "").trim() || null;
  const heroFile = form.get("hero_file");
  const seoTitle = String(form.get("seo_title") ?? "").trim() || null;
  const seoDesc = String(form.get("seo_description") ?? "").trim() || null;
  const contentHtml = sanitizeHtmlBasic(String(form.get("content_html") ?? "").trim()) || null;
  const faqJson = String(form.get("faq_json") ?? "").trim() || "[]";
  if (!iso2 || !name || !slug) return redirect(entityEditLocation("countries", id, entityId, "Missing fields"));
  if (!isValidSlug(slug)) return redirect(entityEditLocation("countries", id, entityId, "Invalid slug"));
  const existing = await env.DB.prepare("SELECT id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM countries WHERE id=?").bind(entityId).first();
  if (existing) await writeRevision(env, user.userId, "countries", entityId, existing);
  let hero = currentHero ?? existing?.hero_image_key ?? null;
  let uploadedNewHero = false;
  if (heroFile instanceof File && heroFile.size > 0) {
    try {
      hero = await uploadImageToR2(env, heroFile, "countries/heroes", "Country hero");
      uploadedNewHero = true;
    } catch (e) {
      return redirect(entityEditLocation("countries", id, entityId, e.message));
    }
  }
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null;
    if (status === "scheduled" && !parsedPublishAt) return redirect(entityEditLocation("countries", id, entityId, "publish_at required for scheduled"));
    await ensureUniqueSlug(env, "countries", slug, entityId);
    await ensureUniqueCountryIso2(env, iso2, entityId);
    if (status === "published" || status === "scheduled") ensureJson(faqJson, "Invalid faq_json");
    if ((status === "published" || status === "scheduled") && hero) await ensureR2KeyExists(env, hero);
  } catch (e) {
    return redirect(entityEditLocation("countries", id, entityId, e.message));
  }
  const publishedAt = toPublishedAt(status, now);
  await env.DB.prepare(
    "INSERT INTO countries (id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET iso2=excluded.iso2,name=excluded.name,slug=excluded.slug,hero_image_key=excluded.hero_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,countries.published_at),updated_at=excluded.updated_at"
  ).bind(entityId, iso2, name, slug, hero, seoTitle, seoDesc, contentHtml, faqJson, status, publishAt, publishedAt, now, now).run();
  await writeAudit(env, user.userId, id ? "update" : "create", "countries", entityId, { slug, status });
  if (status === "published") await writeAudit(env, user.userId, "publish", "countries", entityId, { published_at: now });
  return redirect(`/admin/countries/${entityId}?success=${uploadedNewHero ? "saved_with_image" : "saved"}${uploadedNewHero ? "&uploaded=1" : ""}`);
}
async function adminEditOperatorPage(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const isNew = !id;
  const row = isNew ? null : await dbGet(
    env.DB,
    "SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM operators WHERE id=?",
    [id]
  );
  if (!isNew && !row) return redirect("/admin/operators");
  const canonical = new URL(isNew ? "/admin/operators/new" : `/admin/operators/${id}`, env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const uploaded = url.searchParams.get("uploaded");
  const v = row ?? {
    id: "",
    name: "",
    slug: "",
    website_url: "",
    logo_image_key: null,
    seo_title: "",
    seo_description: "",
    content_html: "",
    faq_json: "[]",
    status: "draft",
    publish_at: null
  };
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? "\u65B0\u589E\u4F9B\u5E94\u5546" : "\u7F16\u8F91\u4F9B\u5E94\u5546"}</h1>
    ${success ? `<section class="card notice success"><strong>\u4FDD\u5B58\u6210\u529F</strong><p>${escapeHtml(success === "saved_with_logo" ? "\u4F9B\u5E94\u5546\u4FE1\u606F\u5DF2\u4FDD\u5B58\uFF0Clogo \u5DF2\u4E0A\u4F20\u5E76\u7ED1\u5B9A\u5230\u5F53\u524D\u8BB0\u5F55\u3002" : "\u4F9B\u5E94\u5546\u4FE1\u606F\u5DF2\u4FDD\u5B58\u3002")}</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4FDD\u5B58\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card">
      <form method="POST" action="${isNew ? "/admin/operators/new" : `/admin/operators/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>website_url</small><input class="input" name="website_url" value="${escapeHtml(v.website_url)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601\uFF0C\u53EF\u7A7A)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? "")}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_logo_image_key" value="${escapeHtml(v.logo_image_key ?? "")}">
        <label><small>logo \u4E0A\u4F20\u5230 R2</small><input class="input" type="file" name="logo_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === "1" ? `<p><small class="hint-success">\u672C\u6B21\u5DF2\u4E0A\u4F20\u65B0\u7684 logo \u56FE\u7247\u3002</small></p>` : ""}
        ${v.logo_image_key ? `<div style="height:8px"></div><p><small>\u5F53\u524D R2 key\uFF1A</small> <code>${escapeHtml(v.logo_image_key)}</code></p>` : "<p><small>\u672A\u4E0A\u4F20 logo\uFF0C\u4FDD\u5B58\u65F6\u5982\u9009\u62E9\u56FE\u7247\u5C06\u81EA\u52A8\u751F\u6210 R2 key\u3002</small></p>"}
        <div style="height:8px"></div>
        <img id="operator-logo-preview" src="${escapeHtml(v.logo_image_key ? mediaUrl(env.APP_ORIGIN, v.logo_image_key) : "")}" alt="${escapeHtml(v.name || v.slug)} logo" width="96" height="96" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.logo_image_key ? "" : "display:none;"}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="logo_file"]')
            const preview = document.getElementById('operator-logo-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              const url = URL.createObjectURL(file)
              preview.src = url
              preview.style.display = 'block'
            })
          })()
        <\/script>
        <div style="height:12px"></div>
        <label><small>seo_title</small><input class="input" name="seo_title" value="${escapeHtml(v.seo_title ?? "")}"></label>
        <div style="height:12px"></div>
        <label><small>seo_description</small><input class="input" name="seo_description" value="${escapeHtml(v.seo_description ?? "")}"></label>
        <div style="height:12px"></div>
        ${editorBlock("content_html", "content_html", v.content_html ?? "")}
        <div style="height:12px"></div>
        ${jsonTextarea("faq_json", "faq_json (FAQPage mainEntity \u6570\u7EC4 JSON)", v.faq_json ?? "[]", 6)}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4FDD\u5B58</button>
        <a class="btn" href="/admin/operators">\u8FD4\u56DE\u5217\u8868</a>
      </form>
    </section>
  </main>
  `;
  return html(
    layout(
      { title: `\u4F9B\u5E94\u5546\u7F16\u8F91 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u7F16\u8F91", canonical, robots: "noindex, nofollow" },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminSaveOperator(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const entityId = id ?? ulid();
  const now = nowIso();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const websiteUrl = String(form.get("website_url") ?? "").trim();
  const status = String(form.get("status") ?? "draft").trim();
  const publishAt = String(form.get("publish_at") ?? "").trim() || null;
  const currentLogo = String(form.get("current_logo_image_key") ?? "").trim() || null;
  const logoFile = form.get("logo_file");
  const seoTitle = String(form.get("seo_title") ?? "").trim() || null;
  const seoDesc = String(form.get("seo_description") ?? "").trim() || null;
  const contentHtml = sanitizeHtmlBasic(String(form.get("content_html") ?? "").trim()) || null;
  const faqJson = String(form.get("faq_json") ?? "").trim() || "[]";
  if (!name || !slug || !websiteUrl) return redirect(operatorEditLocation(id, entityId, "Missing fields"));
  if (!isValidSlug(slug)) return redirect(operatorEditLocation(id, entityId, "Invalid slug"));
  if (!isValidUrl(websiteUrl)) return redirect(operatorEditLocation(id, entityId, "Invalid website_url"));
  const existing = await env.DB.prepare(
    "SELECT id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at FROM operators WHERE id=?"
  ).bind(entityId).first();
  if (existing) await writeRevision(env, user.userId, "operators", entityId, existing);
  let logo = currentLogo ?? existing?.logo_image_key ?? null;
  let uploadedNewLogo = false;
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logo = await uploadOperatorLogo(env, logoFile);
      uploadedNewLogo = true;
    } catch (e) {
      return redirect(operatorEditLocation(id, entityId, e.message));
    }
  }
  const publishedAt = toPublishedAt(status, now);
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null;
    if (status === "scheduled" && !parsedPublishAt) return redirect(operatorEditLocation(id, entityId, "publish_at required for scheduled"));
    await ensureUniqueSlug(env, "operators", slug, entityId);
    if (status === "published" || status === "scheduled") ensureJson(faqJson, "Invalid faq_json");
    if ((status === "published" || status === "scheduled") && logo) await ensureR2KeyExists(env, logo);
  } catch (e) {
    return redirect(operatorEditLocation(id, entityId, e.message));
  }
  await env.DB.prepare(
    "INSERT INTO operators (id, name, slug, website_url, logo_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,website_url=excluded.website_url,logo_image_key=excluded.logo_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,operators.published_at),updated_at=excluded.updated_at"
  ).bind(entityId, name, slug, websiteUrl, logo, seoTitle, seoDesc, contentHtml, faqJson, status, publishAt, publishedAt, now, now).run();
  await writeAudit(env, user.userId, id ? "update" : "create", "operators", entityId, { slug, status });
  if (status === "published") await writeAudit(env, user.userId, "publish", "operators", entityId, { published_at: now });
  return redirect(`/admin/operators/${entityId}?success=${uploadedNewLogo ? "saved_with_logo" : "saved"}${uploadedNewLogo ? "&uploaded=1" : ""}`);
}
async function adminEditProductPage(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const isNew = !id;
  const row = isNew ? null : await dbGet(
    env.DB,
    "SELECT id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at FROM products WHERE id=?",
    [id]
  );
  if (!isNew && !row) return redirect("/admin/products");
  const operators = await dbAll(
    env.DB,
    "SELECT id, name, slug FROM operators ORDER BY name ASC LIMIT 500"
  );
  const operatorId = row?.operator_id ?? (operators[0]?.id ?? "");
  const canonical = new URL(isNew ? "/admin/products/new" : `/admin/products/${id}`, env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const v = row ?? {
    id: "",
    operator_id: operatorId,
    name: "",
    slug: "",
    country_iso2: "",
    days: 7,
    data_gb: null,
    is_unlimited: 0,
    supports_hotspot: 1,
    network_type: "5G",
    price_amount: 0,
    price_currency: "USD",
    purchase_url: "",
    activation_guide_html: "",
    status: "draft",
    publish_at: null
  };
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? "\u65B0\u589E\u5957\u9910" : "\u7F16\u8F91\u5957\u9910"}</h1>
    ${success ? `<section class="card notice success"><strong>\u4FDD\u5B58\u6210\u529F</strong><p>\u5957\u9910\u4FE1\u606F\u5DF2\u4FDD\u5B58\u3002</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4FDD\u5B58\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card">
      <form method="POST" action="${isNew ? "/admin/products/new" : `/admin/products/${escapeHtml(String(id))}`}">
        <label><small>operator</small>
          <select class="input" name="operator_id">${operators.map((o) => `<option value="${escapeHtml(o.id)}" ${o.id === v.operator_id ? "selected" : ""}>${escapeHtml(o.name)} (${escapeHtml(o.slug)})</option>`).join("")}</select>
        </label>
        <div style="height:12px"></div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>name</small><input class="input" name="name" value="${escapeHtml(v.name)}" required></label>
          <label><small>slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>country_iso2</small><input class="input" name="country_iso2" value="${escapeHtml(v.country_iso2)}" required></label>
          <label><small>status</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
          <label><small>days</small><input class="input" name="days" type="number" min="1" value="${escapeHtml(String(v.days))}" required></label>
          <label><small>data_gb</small><input class="input" name="data_gb" type="number" step="0.1" value="${escapeHtml(v.data_gb == null ? "" : String(v.data_gb))}"></label>
          <label><small>is_unlimited</small><select class="input" name="is_unlimited"><option value="0" ${v.is_unlimited ? "" : "selected"}>false</option><option value="1" ${v.is_unlimited ? "selected" : ""}>true</option></select></label>
          <label><small>supports_hotspot</small><select class="input" name="supports_hotspot"><option value="0" ${v.supports_hotspot ? "" : "selected"}>false</option><option value="1" ${v.supports_hotspot ? "selected" : ""}>true</option></select></label>
          <label><small>network_type</small><input class="input" name="network_type" value="${escapeHtml(v.network_type ?? "")}"></label>
          <label><small>price_amount</small><input class="input" name="price_amount" type="number" step="0.01" value="${escapeHtml(String(v.price_amount))}" required></label>
          <label><small>price_currency</small><input class="input" name="price_currency" value="${escapeHtml(v.price_currency)}" required></label>
        </div>
        <div style="height:12px"></div>
        <label><small>purchase_url</small><input class="input" name="purchase_url" value="${escapeHtml(v.purchase_url)}" required></label>
        <div style="height:12px"></div>
        <label><small>publish_at (ISO8601\uFF0C\u53EF\u7A7A)</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? "")}"></label>
        <div style="height:12px"></div>
        ${editorBlock("activation_guide_html", "activation_guide_html", v.activation_guide_html ?? "")}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4FDD\u5B58</button>
        <a class="btn" href="/admin/products">\u8FD4\u56DE\u5217\u8868</a>
      </form>
    </section>
  </main>
  `;
  return html(
    layout(
      { title: `\u5957\u9910\u7F16\u8F91 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u7F16\u8F91", canonical, robots: "noindex, nofollow" },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminSaveProduct(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const entityId = id ?? ulid();
  const now = nowIso();
  const operatorId = String(form.get("operator_id") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const countryIso2 = String(form.get("country_iso2") ?? "").toLowerCase().trim();
  const status = String(form.get("status") ?? "draft").trim();
  const publishAt = String(form.get("publish_at") ?? "").trim() || null;
  const days = parseInt(String(form.get("days") ?? "0"), 10);
  const dataGbStr = String(form.get("data_gb") ?? "").trim();
  const dataGb = dataGbStr ? Number(dataGbStr) : null;
  const isUnlimited = String(form.get("is_unlimited") ?? "0") === "1" ? 1 : 0;
  const supportsHotspot = String(form.get("supports_hotspot") ?? "1") === "1" ? 1 : 0;
  const networkType = String(form.get("network_type") ?? "").trim() || null;
  const priceAmount = Number(String(form.get("price_amount") ?? "0"));
  const priceCurrency = String(form.get("price_currency") ?? "").trim().toUpperCase();
  const purchaseUrl = String(form.get("purchase_url") ?? "").trim();
  const activation = sanitizeHtmlBasic(String(form.get("activation_guide_html") ?? "").trim()) || null;
  if (!operatorId || !name || !slug || !countryIso2 || !purchaseUrl) return redirect(entityEditLocation("products", id, entityId, "Missing fields"));
  if (!isValidSlug(slug)) return redirect(entityEditLocation("products", id, entityId, "Invalid slug"));
  if (!isValidUrl(purchaseUrl)) return redirect(entityEditLocation("products", id, entityId, "Invalid purchase_url"));
  if (!Number.isFinite(days) || days < 1) return redirect(entityEditLocation("products", id, entityId, "Invalid days"));
  if (!Number.isFinite(priceAmount) || priceAmount < 0) return redirect(entityEditLocation("products", id, entityId, "Invalid price"));
  try {
    const parsedPublishAt = publishAt ? parseIsoOrNull(publishAt) : null;
    if (status === "scheduled" && !parsedPublishAt) return redirect(entityEditLocation("products", id, entityId, "publish_at required for scheduled"));
    await ensureUniqueSlug(env, "products", slug, entityId);
    if (status === "published" || status === "scheduled") {
      await ensureExists(env, "SELECT id as ok FROM operators WHERE id=? LIMIT 1", [operatorId], "Invalid operator_id");
      await ensureExists(env, "SELECT id as ok FROM countries WHERE iso2=? LIMIT 1", [countryIso2], "Invalid country_iso2");
    }
  } catch (e) {
    return redirect(entityEditLocation("products", id, entityId, e.message));
  }
  const existing = await env.DB.prepare(
    "SELECT id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at FROM products WHERE id=?"
  ).bind(entityId).first();
  if (existing) await writeRevision(env, user.userId, "products", entityId, existing);
  const publishedAt = toPublishedAt(status, now);
  await env.DB.prepare(
    "INSERT INTO products (id, operator_id, name, slug, country_iso2, days, data_gb, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, activation_guide_html, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET operator_id=excluded.operator_id,name=excluded.name,slug=excluded.slug,country_iso2=excluded.country_iso2,days=excluded.days,data_gb=excluded.data_gb,is_unlimited=excluded.is_unlimited,supports_hotspot=excluded.supports_hotspot,network_type=excluded.network_type,price_amount=excluded.price_amount,price_currency=excluded.price_currency,purchase_url=excluded.purchase_url,activation_guide_html=excluded.activation_guide_html,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,products.published_at),updated_at=excluded.updated_at"
  ).bind(
    entityId,
    operatorId,
    name,
    slug,
    countryIso2,
    days,
    dataGb,
    isUnlimited,
    supportsHotspot,
    networkType,
    priceAmount,
    priceCurrency,
    purchaseUrl,
    activation,
    status,
    publishAt,
    publishedAt,
    now,
    now
  ).run();
  await writeAudit(env, user.userId, id ? "update" : "create", "products", entityId, { slug, status });
  if (status === "published") await writeAudit(env, user.userId, "publish", "products", entityId, { published_at: now });
  return redirect(`/admin/products/${entityId}?success=saved`);
}
async function adminEditPostPage(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const isNew = !id;
  const categories = await dbAll(env.DB, "SELECT id, name, slug FROM categories ORDER BY sort_order ASC, name ASC LIMIT 1000");
  const row = isNew ? null : await dbGet(
    env.DB,
    "SELECT id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at FROM posts WHERE id=?",
    [id]
  );
  if (!isNew && !row) return redirect("/admin/posts");
  const canonical = new URL(isNew ? "/admin/posts/new" : `/admin/posts/${id}`, env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const uploaded = url.searchParams.get("uploaded");
  const v = row ?? {
    id: "",
    category_id: null,
    post_type: "guide",
    ref_slug: null,
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    cover_image_key: null,
    locale: "en",
    status: "draft",
    publish_at: null
  };
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>${isNew ? "\u65B0\u589E\u6587\u7AE0" : "\u7F16\u8F91\u6587\u7AE0"}</h1>
    ${success ? `<section class="card notice success"><strong>\u4FDD\u5B58\u6210\u529F</strong><p>${escapeHtml(success === "saved_with_image" ? "\u6587\u7AE0\u4FE1\u606F\u5DF2\u4FDD\u5B58\uFF0C\u5C01\u9762\u56FE\u5DF2\u4E0A\u4F20\u5E76\u7ED1\u5B9A\u5230\u5F53\u524D\u8BB0\u5F55\u3002" : "\u6587\u7AE0\u4FE1\u606F\u5DF2\u4FDD\u5B58\u3002")}</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4FDD\u5B58\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card muted-panel">
      <div class="admin-actions">
        <a class="btn" href="/admin/posts">\u8FD4\u56DE\u6587\u7AE0\u5217\u8868</a>
        <a class="btn" href="/admin/categories">\u7BA1\u7406\u6587\u7AE0\u5206\u7C7B</a>
        ${!isNew ? `<a class="btn" href="/post/${escapeHtml(v.slug)}" target="_blank" rel="noopener">\u9884\u89C8\u516C\u5F00\u9875</a>` : ""}
      </div>
    </section>
    <section class="card">
      <form method="POST" action="${isNew ? "/admin/posts/new" : `/admin/posts/${escapeHtml(String(id))}`}" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>\u6587\u7AE0\u6807\u9898</small><input class="input" name="title" value="${escapeHtml(v.title)}" required></label>
          <label><small>Slug</small><input class="input" name="slug" value="${escapeHtml(v.slug)}" required></label>
          <label><small>\u6587\u7AE0\u5206\u7C7B</small>
            <select class="input" name="category_id">
              <option value="">(\u672A\u5206\u7C7B)</option>
              ${categories.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === v.category_id ? "selected" : ""}>${escapeHtml(c.name)} (${escapeHtml(c.slug)})</option>`).join("")}
            </select>
          </label>
          <label><small>\u6587\u7AE0\u8BED\u8A00</small><select class="input" name="locale">${localeOptions(v.locale)}</select></label>
          <label><small>\u5173\u8054 Slug\uFF08\u53EF\u7A7A\uFF09</small><input class="input" name="ref_slug" value="${escapeHtml(v.ref_slug ?? "")}"></label>
          <label><small>\u53D1\u5E03\u72B6\u6001</small><select class="input" name="status">${statusOptions(v.status)}</select></label>
        </div>
        <div style="height:12px"></div>
        <label><small>\u5B9A\u65F6\u53D1\u5E03\u65F6\u95F4\uFF08ISO8601\uFF0C\u53EF\u7A7A\uFF09</small><input class="input" name="publish_at" value="${escapeHtml(v.publish_at ?? "")}"></label>
        <div style="height:12px"></div>
        <input type="hidden" name="current_cover_image_key" value="${escapeHtml(v.cover_image_key ?? "")}">
        <label><small>\u5C01\u9762\u56FE\u4E0A\u4F20\u5230 R2</small><input class="input" type="file" name="cover_file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
        ${uploaded === "1" ? `<p><small class="hint-success">\u672C\u6B21\u5DF2\u4E0A\u4F20\u65B0\u7684\u5C01\u9762\u56FE\u3002</small></p>` : ""}
        ${v.cover_image_key ? `<div style="height:8px"></div><p><small>\u5F53\u524D R2 key\uFF1A</small> <code>${escapeHtml(v.cover_image_key)}</code></p>` : "<p><small>\u672A\u4E0A\u4F20\u5C01\u9762\u56FE\uFF0C\u4FDD\u5B58\u65F6\u5982\u9009\u62E9\u56FE\u7247\u5C06\u81EA\u52A8\u751F\u6210 R2 key\u3002</small></p>"}
        <div style="height:8px"></div>
        <img id="post-cover-preview" src="${escapeHtml(v.cover_image_key ? mediaUrl(env.APP_ORIGIN, v.cover_image_key) : "")}" alt="${escapeHtml(v.title || v.slug)}" width="320" height="180" loading="lazy" style="border-radius:12px;border:1px solid var(--b);object-fit:cover;${v.cover_image_key ? "" : "display:none;"}" />
        <script>
          (() => {
            const input = document.querySelector('input[name="cover_file"]')
            const preview = document.getElementById('post-cover-preview')
            if (!(input instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement)) return
            input.addEventListener('change', () => {
              const file = input.files && input.files[0]
              if (!file) return
              preview.src = URL.createObjectURL(file)
              preview.style.display = 'block'
            })
          })()
        <\/script>
        <div style="height:12px"></div>
        <label><small>\u6587\u7AE0\u6458\u8981\uFF08\u53EF\u7A7A\uFF09</small><textarea class="input" name="excerpt" rows="3">${escapeHtml(v.excerpt ?? "")}</textarea></label>
        <div style="height:12px"></div>
        ${editorBlock("content_html", "\u6B63\u6587\u5185\u5BB9", v.content_html ?? "")}
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4FDD\u5B58</button>
        <a class="btn" href="/admin/posts">\u8FD4\u56DE\u6587\u7AE0\u5217\u8868</a>
      </form>
    </section>
  </main>
  `;
  return html(
    layout({ title: `\u6587\u7AE0\u7F16\u8F91 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u7F16\u8F91", canonical, robots: "noindex, nofollow" }, body, criticalCss()),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminSavePost(env, req, id) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest("Invalid form");
  const entityId = id ?? ulid();
  const now = nowIso();
  const title = String(form.get("title") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const categoryId = String(form.get("category_id") ?? "").trim() || null;
  const locale = String(form.get("locale") ?? "").trim() || "en";
  const refSlug = String(form.get("ref_slug") ?? "").trim() || null;
  const status = String(form.get("status") ?? "draft").trim();
  const publishAtRaw = String(form.get("publish_at") ?? "").trim() || null;
  const currentCover = String(form.get("current_cover_image_key") ?? "").trim() || null;
  const coverFile = form.get("cover_file");
  const excerpt = String(form.get("excerpt") ?? "").trim() || null;
  const contentHtml = sanitizeHtmlBasic(String(form.get("content_html") ?? "").trim());
  if (!title || !slug || !contentHtml) return redirect(entityEditLocation("posts", id, entityId, "Missing fields"));
  if (!isValidSlug(slug)) return redirect(entityEditLocation("posts", id, entityId, "Invalid slug"));
  const existing = await env.DB.prepare(
    "SELECT id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at FROM posts WHERE id=?"
  ).bind(entityId).first();
  const postType = existing?.post_type || "guide";
  if (existing) await writeRevision(env, user.userId, "posts", entityId, existing);
  let cover = currentCover ?? existing?.cover_image_key ?? null;
  let uploadedNewCover = false;
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      cover = await uploadImageToR2(env, coverFile, "posts/covers", "Post cover");
      uploadedNewCover = true;
    } catch (e) {
      return redirect(entityEditLocation("posts", id, entityId, e.message));
    }
  }
  try {
    const parsedPublishAt = publishAtRaw ? parseIsoOrNull(publishAtRaw) : null;
    if (status === "scheduled" && !parsedPublishAt) return redirect(entityEditLocation("posts", id, entityId, "publish_at required for scheduled"));
    await ensureUniqueSlug(env, "posts", slug, entityId);
    if (categoryId) await ensureExists(env, "SELECT id as ok FROM categories WHERE id=? LIMIT 1", [categoryId], "Invalid category_id");
    if ((status === "published" || status === "scheduled") && cover) await ensureR2KeyExists(env, cover);
  } catch (e) {
    return redirect(entityEditLocation("posts", id, entityId, e.message));
  }
  const publishedAt = toPublishedAt(status, now);
  await env.DB.prepare(
    "INSERT INTO posts (id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,post_type=excluded.post_type,ref_slug=excluded.ref_slug,title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content_html=excluded.content_html,cover_image_key=excluded.cover_image_key,locale=excluded.locale,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,posts.published_at),updated_at=excluded.updated_at"
  ).bind(entityId, categoryId, postType, refSlug, title, slug, excerpt, contentHtml, cover, locale, status, publishAtRaw, publishedAt, now, now).run();
  await writeAudit(env, user.userId, id ? "update" : "create", "posts", entityId, { slug, status });
  if (status === "published") await writeAudit(env, user.userId, "publish", "posts", entityId, { published_at: now });
  return redirect(`/admin/posts/${entityId}?success=${uploadedNewCover ? "saved_with_image" : "saved"}${uploadedNewCover ? "&uploaded=1" : ""}`);
}
async function adminMediaPage(env, req, uploadedKey) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const url = new URL(req.url);
  const canonical = new URL("/admin/media", env.APP_ORIGIN).toString();
  const success = url.searchParams.get("success");
  const error = url.searchParams.get("error");
  const uploaded = uploadedKey ? `<p><small>\u5DF2\u4E0A\u4F20\uFF1A</small> <code>${escapeHtml(uploadedKey)}</code></p><p><a class="btn" href="${escapeHtml(mediaUrl(env.APP_ORIGIN, uploadedKey))}" target="_blank" rel="noopener">\u6253\u5F00\u6587\u4EF6</a></p>` : "";
  const body = `
  ${adminNav(env, req, resolveLocale(req))}
  <main>
    <h1>\u5A92\u4F53\u5E93\uFF08\u6700\u5C0F\u53EF\u7528\uFF09</h1>
    ${success ? `<section class="card notice success"><strong>\u4E0A\u4F20\u6210\u529F</strong><p>\u5A92\u4F53\u6587\u4EF6\u5DF2\u4E0A\u4F20\u5230 R2\u3002</p></section>` : ""}
    ${error ? `<section class="card notice error"><strong>\u4E0A\u4F20\u5931\u8D25</strong><p>${escapeHtml(error)}</p></section>` : ""}
    <section class="card">
      <form method="POST" action="/admin/media" enctype="multipart/form-data">
        <label><small>\u9009\u62E9\u6587\u4EF6</small><input class="input" type="file" name="file" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u4E0A\u4F20\u5230 R2</button>
      </form>
      <div style="height:12px"></div>
      ${uploaded}
    </section>
  </main>
  `;
  return html(
    layout(
      { title: `\u5A92\u4F53\u5E93 | ${env.SITE_NAME}`, description: "\u540E\u53F0\u5A92\u4F53", canonical, robots: "noindex, nofollow" },
      body,
      criticalCss()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function adminMediaUpload(env, req) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  if (!form) return redirect("/admin/media?error=Invalid%20form");
  const file = form.get("file");
  if (!(file instanceof File)) return redirect("/admin/media?error=Missing%20file");
  if (file.size <= 0) return redirect("/admin/media?error=Empty%20file");
  if (file.size > 8 * 1024 * 1024) return redirect("/admin/media?error=File%20too%20large");
  const contentType = file.type || "application/octet-stream";
  const ext = guessExt2(file.name, contentType);
  const key = `uploads/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${ulid()}${ext}`;
  await putObject(env, key, await file.arrayBuffer(), contentType);
  return redirect(`/admin/media?success=uploaded&uploaded=${encodeURIComponent(key)}`);
}
function guessExt2(name, contentType) {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (ext && ext.length <= 8) return ext;
  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/svg+xml") return ".svg";
  return "";
}
async function uploadOperatorLogo(env, file) {
  return uploadImageToR2(env, file, "operators/logos", "Logo");
}
function operatorEditLocation(id, entityId, error) {
  const base = id ? `/admin/operators/${entityId}` : "/admin/operators/new";
  return `${base}?error=${encodeURIComponent(error)}`;
}
async function uploadImageToR2(env, file, prefix, label) {
  if (file.size <= 0) throw new Error(`Empty ${label.toLowerCase()} file`);
  if (file.size > 8 * 1024 * 1024) throw new Error(`${label} file too large`);
  const contentType = file.type || "application/octet-stream";
  if (!/^image\/(?:png|jpeg|webp|svg\+xml)$/i.test(contentType)) {
    throw new Error(`Unsupported ${label.toLowerCase()} image type`);
  }
  const ext = guessExt2(file.name, contentType);
  const key = `${prefix}/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${ulid()}${ext}`;
  await putObject(env, key, await file.arrayBuffer(), contentType);
  return key;
}
function entityEditLocation(entity, id, entityId, error) {
  const base = id ? `/admin/${entity}/${entityId}` : `/admin/${entity}/new`;
  return `${base}?error=${encodeURIComponent(error)}`;
}

// src/pages/admin-import.ts
function adminNav2(env, req, locale) {
  const current = new URL(req.url);
  const currentPath = `${current.pathname}${current.search}`;
  return `<header>
    <nav class="nav-shell">
      <a class="nav-brand" href="/">
        <span class="brand-badge">CMS</span>
        <span class="brand-copy">
          <strong>${escapeHtml(env.SITE_NAME)}</strong>
          <small>\u5185\u5BB9\u53D1\u5E03\u4E0E\u7D20\u6750\u7BA1\u7406\u540E\u53F0</small>
        </span>
      </a>
      <div class="nav-links">
        <a class="nav-link" href="/admin">${escapeHtml(pick(locale, "\u6982\u89C8", "Overview"))}</a>
        <a class="nav-link" href="/admin/countries">${escapeHtml(pick(locale, "\u56FD\u5BB6", "Countries"))}</a>
        <a class="nav-link" href="/admin/operators">${escapeHtml(pick(locale, "\u4F9B\u5E94\u5546", "Operators"))}</a>
        <a class="nav-link" href="/admin/products">${escapeHtml(pick(locale, "\u5957\u9910", "Products"))}</a>
        <a class="nav-link" href="/admin/posts">${escapeHtml(pick(locale, "\u6587\u7AE0", "Posts"))}</a>
        <a class="nav-link" href="/admin/media">${escapeHtml(pick(locale, "\u5A92\u4F53", "Media"))}</a>
        <a class="nav-link" href="/admin/import-export">${escapeHtml(pick(locale, "\u5BFC\u5165/\u5BFC\u51FA", "Import / Export"))}</a>
      </div>
      <div class="nav-actions">
        <a class="btn ${locale === "zh" ? "primary" : ""}" data-lang-switch="zh" href="${escapeHtml(languageSwitchHref("zh", currentPath))}">\u4E2D\u6587</a>
        <a class="btn ${locale === "en" ? "primary" : ""}" data-lang-switch="en" href="${escapeHtml(languageSwitchHref("en", currentPath))}">EN</a>
        <form method="POST" action="/api/admin/auth/logout"><button class="btn" type="submit">\u9000\u51FA</button></form>
      </div>
    </nav>
  </header>`;
}
async function adminImportExportPage(env, req) {
  const user = await requireAdmin(env, req);
  if (!user) return redirect("/admin/login");
  const canonical = new URL("/admin/import-export", env.APP_ORIGIN).toString();
  const body = `
  ${adminNav2(env, req, resolveLocale(req))}
  <main>
    <section class="page-header">
      <span class="eyebrow">Import / Export</span>
      <div>
        <h1>\u6279\u91CF\u5BFC\u5165 / \u5BFC\u51FA</h1>
        <p>\u6279\u91CF\u7EF4\u62A4\u7ED3\u6784\u5316\u5185\u5BB9\u6570\u636E\uFF0C\u9002\u5408\u521D\u59CB\u5316\u5BFC\u5165\u3001\u5907\u4EFD\u5BFC\u51FA\u548C\u8DE8\u73AF\u5883\u8FC1\u79FB\u3002</p>
      </div>
    </section>
    <section class="card">
      <h2>\u5BFC\u51FA</h2>
      <div class="admin-actions">
        ${["categories", "countries", "operators", "products", "posts"].map((e) => {
    const entity = String(e);
    return `<a class="btn" href="/api/admin/export?entity=${encodeURIComponent(entity)}&format=json">\u5BFC\u51FA ${escapeHtml(entity)}.json</a>
              <a class="btn" href="/api/admin/export?entity=${encodeURIComponent(entity)}&format=csv">\u5BFC\u51FA ${escapeHtml(entity)}.csv</a>`;
  }).join("")}
      </div>
    </section>
    <div style="height:12px"></div>
    <section class="card muted-panel">
      <h2>\u5BFC\u5165</h2>
      <form method="POST" action="/api/admin/import" enctype="multipart/form-data">
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label><small>entity</small>
            <select class="input" name="entity">
              <option value="categories">categories</option>
              <option value="countries">countries</option>
              <option value="operators">operators</option>
              <option value="products">products</option>
              <option value="posts">posts</option>
            </select>
          </label>
          <label><small>format</small>
            <select class="input" name="format">
              <option value="json">json</option>
              <option value="csv">csv</option>
            </select>
          </label>
        </div>
        <div style="height:12px"></div>
        <label><small>file</small><input class="input" type="file" name="file" required></label>
        <div style="height:12px"></div>
        <button class="btn primary" type="submit">\u5F00\u59CB\u5BFC\u5165</button>
      </form>
      <div style="height:8px"></div>
      <small>\u5BFC\u5165\u4F1A\u6309 id\uFF08\u6216 slug\uFF09\u505A upsert\uFF1B\u66F4\u65B0\u65F6\u95F4\u7EDF\u4E00\u5199\u4E3A\u5F53\u524D\u65F6\u95F4\u3002</small>
    </section>
  </main>
  `;
  return html(
    layout({ title: `\u5BFC\u5165/\u5BFC\u51FA | ${env.SITE_NAME}`, description: "\u6279\u91CF\u5BFC\u5165\u5BFC\u51FA", canonical, robots: "noindex, nofollow" }, body, criticalCss()),
    { headers: { "Cache-Control": "no-store" } }
  );
}
async function apiAdminExport(env, req) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const entity = String(url.searchParams.get("entity") ?? "");
  const format = String(url.searchParams.get("format") ?? "json");
  if (!isEntity(entity)) return badRequest("Invalid entity");
  if (format !== "json" && format !== "csv") return badRequest("Invalid format");
  const rows = await dbAll(env.DB, `SELECT * FROM ${entity} ORDER BY updated_at DESC LIMIT 20000`);
  if (format === "json") {
    const body2 = JSON.stringify(rows, null, 2);
    return new Response(body2, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity}.json"`,
        "Cache-Control": "no-store"
      }
    });
  }
  const columns = csvColumns(entity);
  const body = csvEncode(rows, columns);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
async function apiAdminImport(env, req) {
  const user = await requireAdmin(env, req);
  if (!user) return unauthorized();
  const now = nowIso();
  const ct = req.headers.get("content-type") ?? "";
  let entity;
  let format;
  let items;
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");
    entity = String(body.entity ?? "");
    format = String(body.format ?? "json");
    if (!isEntity(entity)) return badRequest("Invalid entity");
    if (format !== "json") return badRequest("JSON body supports json format only");
    try {
      items = Array.isArray(body.rows) ? body.rows : Array.isArray(body.items) ? body.items : Array.isArray(body.data) ? body.data : [];
      if (!Array.isArray(items)) items = [];
      items = items.filter((x) => x && typeof x === "object");
    } catch {
      return badRequest("Invalid rows");
    }
  } else {
    const form = await req.formData().catch(() => null);
    if (!form) return badRequest("Invalid form");
    entity = String(form.get("entity") ?? "");
    format = String(form.get("format") ?? "json");
    const file = form.get("file");
    if (!isEntity(entity)) return badRequest("Invalid entity");
    if (format !== "json" && format !== "csv") return badRequest("Invalid format");
    if (!(file instanceof File)) return badRequest("Missing file");
    if (file.size <= 0) return badRequest("Empty file");
    if (file.size > 20 * 1024 * 1024) return badRequest("File too large");
    const text = await file.text();
    try {
      items = format === "json" ? parseJsonArray(text) : csvToObjects(text);
    } catch (e) {
      return badRequest(e.message);
    }
  }
  if (items.length === 0) return badRequest("No rows");
  const stmt = upsertStmt(entity);
  let ok = 0;
  for (const item of items) {
    const v = normalize(entity, item, now);
    if (!v) continue;
    await env.DB.prepare(stmt.sql).bind(...stmt.bind(v)).run();
    ok += 1;
  }
  await env.DB.prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, detail_json, created_at) VALUES (?,?,?,?,?,?,?)").bind(ulid(), user.userId, "import", entity, null, JSON.stringify({ ok, total: items.length, format }), now).run();
  return redirect("/admin/import-export");
}
function isEntity(e) {
  return e === "categories" || e === "countries" || e === "operators" || e === "products" || e === "posts";
}
function parseJsonArray(text) {
  const v = JSON.parse(text);
  if (!Array.isArray(v)) throw new Error("JSON must be an array");
  return v.filter((x) => x && typeof x === "object");
}
function csvColumns(entity) {
  if (entity === "categories") return ["id", "parent_id", "name", "slug", "sort_order", "created_at", "updated_at"];
  if (entity === "countries")
    return [
      "id",
      "iso2",
      "name",
      "slug",
      "hero_image_key",
      "seo_title",
      "seo_description",
      "content_html",
      "faq_json",
      "status",
      "publish_at",
      "published_at",
      "created_at",
      "updated_at"
    ];
  if (entity === "operators")
    return [
      "id",
      "name",
      "slug",
      "website_url",
      "logo_image_key",
      "support_channels_json",
      "seo_title",
      "seo_description",
      "content_html",
      "faq_json",
      "status",
      "publish_at",
      "published_at",
      "created_at",
      "updated_at"
    ];
  if (entity === "products")
    return [
      "id",
      "operator_id",
      "category_id",
      "country_iso2",
      "name",
      "slug",
      "data_gb",
      "days",
      "is_unlimited",
      "supports_hotspot",
      "network_type",
      "price_amount",
      "price_currency",
      "purchase_url",
      "coverage_regions_json",
      "activation_guide_html",
      "status",
      "publish_at",
      "published_at",
      "created_at",
      "updated_at"
    ];
  return [
    "id",
    "category_id",
    "post_type",
    "ref_slug",
    "title",
    "slug",
    "excerpt",
    "content_html",
    "cover_image_key",
    "locale",
    "status",
    "publish_at",
    "published_at",
    "created_at",
    "updated_at"
  ];
}
function csvEncode(rows, columns) {
  const lines = [];
  lines.push(columns.join(","));
  for (const r of rows) {
    lines.push(
      columns.map((c) => {
        const v = r[c];
        const s = v == null ? "" : String(v);
        return csvCell(s);
      }).join(",")
    );
  }
  return lines.join("\n") + "\n";
}
function csvCell(s) {
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvToObjects(text) {
  const rows = csvParse(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((x) => !x)) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = row[j] ?? "";
    out.push(obj);
  }
  return out;
}
function csvParse(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cur);
      cur = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    cur += ch;
    i += 1;
  }
  row.push(cur);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}
function upsertStmt(entity) {
  if (entity === "categories") {
    return {
      sql: "INSERT INTO categories (id, parent_id, name, slug, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,name=excluded.name,slug=excluded.slug,sort_order=excluded.sort_order,updated_at=excluded.updated_at",
      bind: (r) => [r.id, r.parent_id, r.name, r.slug, r.sort_order, r.created_at, r.updated_at]
    };
  }
  if (entity === "countries") {
    return {
      sql: "INSERT INTO countries (id, iso2, name, slug, hero_image_key, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET iso2=excluded.iso2,name=excluded.name,slug=excluded.slug,hero_image_key=excluded.hero_image_key,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,countries.published_at),updated_at=excluded.updated_at",
      bind: (r) => [
        r.id,
        r.iso2,
        r.name,
        r.slug,
        r.hero_image_key,
        r.seo_title,
        r.seo_description,
        r.content_html,
        r.faq_json,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    };
  }
  if (entity === "operators") {
    return {
      sql: "INSERT INTO operators (id, name, slug, website_url, logo_image_key, support_channels_json, seo_title, seo_description, content_html, faq_json, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,website_url=excluded.website_url,logo_image_key=excluded.logo_image_key,support_channels_json=excluded.support_channels_json,seo_title=excluded.seo_title,seo_description=excluded.seo_description,content_html=excluded.content_html,faq_json=excluded.faq_json,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,operators.published_at),updated_at=excluded.updated_at",
      bind: (r) => [
        r.id,
        r.name,
        r.slug,
        r.website_url,
        r.logo_image_key,
        r.support_channels_json,
        r.seo_title,
        r.seo_description,
        r.content_html,
        r.faq_json,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    };
  }
  if (entity === "products") {
    return {
      sql: "INSERT INTO products (id, operator_id, category_id, country_iso2, name, slug, data_gb, days, is_unlimited, supports_hotspot, network_type, price_amount, price_currency, purchase_url, coverage_regions_json, activation_guide_html, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET operator_id=excluded.operator_id,category_id=excluded.category_id,country_iso2=excluded.country_iso2,name=excluded.name,slug=excluded.slug,data_gb=excluded.data_gb,days=excluded.days,is_unlimited=excluded.is_unlimited,supports_hotspot=excluded.supports_hotspot,network_type=excluded.network_type,price_amount=excluded.price_amount,price_currency=excluded.price_currency,purchase_url=excluded.purchase_url,coverage_regions_json=excluded.coverage_regions_json,activation_guide_html=excluded.activation_guide_html,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,products.published_at),updated_at=excluded.updated_at",
      bind: (r) => [
        r.id,
        r.operator_id,
        r.category_id,
        r.country_iso2,
        r.name,
        r.slug,
        r.data_gb,
        r.days,
        r.is_unlimited,
        r.supports_hotspot,
        r.network_type,
        r.price_amount,
        r.price_currency,
        r.purchase_url,
        r.coverage_regions_json,
        r.activation_guide_html,
        r.status,
        r.publish_at,
        r.published_at,
        r.created_at,
        r.updated_at
      ]
    };
  }
  return {
    sql: "INSERT INTO posts (id, category_id, post_type, ref_slug, title, slug, excerpt, content_html, cover_image_key, locale, status, publish_at, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,post_type=excluded.post_type,ref_slug=excluded.ref_slug,title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content_html=excluded.content_html,cover_image_key=excluded.cover_image_key,locale=excluded.locale,status=excluded.status,publish_at=excluded.publish_at,published_at=COALESCE(excluded.published_at,posts.published_at),updated_at=excluded.updated_at",
    bind: (r) => [
      r.id,
      r.category_id,
      r.post_type,
      r.ref_slug,
      r.title,
      r.slug,
      r.excerpt,
      r.content_html,
      r.cover_image_key,
      r.locale,
      r.status,
      r.publish_at,
      r.published_at,
      r.created_at,
      r.updated_at
    ]
  };
}
function normalize(entity, item, now) {
  const id = asStr(item.id) || ulid();
  if (entity === "categories") {
    const name = asStr(item.name);
    const slug2 = asStr(item.slug);
    if (!name || !slug2) return null;
    return {
      id,
      parent_id: asStr(item.parent_id) || null,
      name,
      slug: slug2,
      sort_order: toInt(item.sort_order) ?? 0,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    };
  }
  if (entity === "countries") {
    const iso2 = (asStr(item.iso2) || "").toLowerCase().trim();
    const name = asStr(item.name);
    const slug2 = asStr(item.slug);
    if (!iso2 || !name || !slug2) return null;
    return {
      id,
      iso2,
      name,
      slug: slug2,
      hero_image_key: asStr(item.hero_image_key) || null,
      seo_title: asStr(item.seo_title) || null,
      seo_description: asStr(item.seo_description) || null,
      content_html: asStr(item.content_html) || null,
      faq_json: asStr(item.faq_json) || "[]",
      status: asStr(item.status) || "draft",
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    };
  }
  if (entity === "operators") {
    const name = asStr(item.name);
    const slug2 = asStr(item.slug);
    const website_url = asStr(item.website_url);
    if (!name || !slug2 || !website_url) return null;
    return {
      id,
      name,
      slug: slug2,
      website_url,
      logo_image_key: asStr(item.logo_image_key) || null,
      support_channels_json: asStr(item.support_channels_json) || null,
      seo_title: asStr(item.seo_title) || null,
      seo_description: asStr(item.seo_description) || null,
      content_html: asStr(item.content_html) || null,
      faq_json: asStr(item.faq_json) || "[]",
      status: asStr(item.status) || "draft",
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    };
  }
  if (entity === "products") {
    const operator_id = asStr(item.operator_id);
    const name = asStr(item.name);
    const slug2 = asStr(item.slug);
    const country_iso2 = (asStr(item.country_iso2) || "").toLowerCase().trim();
    const days = toInt(item.days);
    const price_amount = toNum(item.price_amount);
    const price_currency = (asStr(item.price_currency) || "").toUpperCase().trim();
    const purchase_url = asStr(item.purchase_url);
    if (!operator_id || !name || !slug2 || !country_iso2 || !days || price_amount == null || !price_currency || !purchase_url) return null;
    return {
      id,
      operator_id,
      category_id: asStr(item.category_id) || null,
      country_iso2,
      name,
      slug: slug2,
      data_gb: toNum(item.data_gb),
      days,
      is_unlimited: toInt(item.is_unlimited) ?? 0,
      supports_hotspot: toInt(item.supports_hotspot) ?? 1,
      network_type: asStr(item.network_type) || null,
      price_amount,
      price_currency,
      purchase_url,
      coverage_regions_json: asStr(item.coverage_regions_json) || null,
      activation_guide_html: asStr(item.activation_guide_html) || null,
      status: asStr(item.status) || "draft",
      publish_at: asStr(item.publish_at) || null,
      published_at: asStr(item.published_at) || null,
      created_at: asStr(item.created_at) || now,
      updated_at: now
    };
  }
  const title = asStr(item.title);
  const slug = asStr(item.slug);
  const content_html = asStr(item.content_html);
  if (!title || !slug || !content_html) return null;
  return {
    id,
    category_id: asStr(item.category_id) || null,
    post_type: asStr(item.post_type) || "guide",
    ref_slug: asStr(item.ref_slug) || null,
    title,
    slug,
    excerpt: asStr(item.excerpt) || null,
    content_html,
    cover_image_key: asStr(item.cover_image_key) || null,
    locale: asStr(item.locale) || "en",
    status: asStr(item.status) || "draft",
    publish_at: asStr(item.publish_at) || null,
    published_at: asStr(item.published_at) || null,
    created_at: asStr(item.created_at) || now,
    updated_at: now
  };
}
function asStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function toInt(v) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}
function toNum(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

// src/index.ts
var router = new Router();
router.on("GET", "/", async ({ req }) => withHtmlCache(req, (env) => homePage(env, req)));
router.on("GET", "/search", async ({ req }) => withHtmlCache(req, (env) => searchPage(env, req)));
router.on("GET", "/posts", async ({ req }) => withHtmlCache(req, (env) => postsIndexPage(env, req)));
router.on("GET", "/posts/category/:slug", async ({ req, params }) => withHtmlCache(req, (env) => postCategoryPage(env, req, params.slug)));
router.on("GET", "/post/:slug", async ({ req, params }) => withHtmlCache(req, (env) => postPage(env, req, params.slug)));
router.on("GET", "/country/:slug", async ({ req, params }) => withHtmlCache(req, (env) => countryPage(env, req, params.slug)));
router.on("GET", "/operator/:slug", async ({ req, params }) => withHtmlCache(req, (env) => operatorPage(env, req, params.slug)));
router.on("GET", "/product/:slug", async ({ req, params }) => withHtmlCache(req, (env) => productPage(env, req, params.slug)));
router.on("GET", "/set-language", async ({ req }) => {
  const url = new URL(req.url);
  const lang = normalizeLocale(url.searchParams.get("lang"));
  if (!lang) return notFound();
  const redirectTo = sanitizeRedirectPath(url.searchParams.get("redirect"));
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", makeLocaleCookie(req, lang));
  const body = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${redirectTo}"><script>location.replace(${JSON.stringify(
    redirectTo
  )})<\/script></head><body>Switching language...</body></html>`;
  return new Response(body, { status: 200, headers });
});
router.on("GET", "/admin/login", async ({ req }) => adminLoginPage(req.env, req));
router.on("GET", "/admin", async ({ req }) => adminHomePage(req.env, req));
router.on("GET", "/admin/categories", async ({ req }) => adminListPage(req.env, req, "categories"));
router.on("GET", "/admin/categories/new", async ({ req }) => adminEditCategoryPage(req.env, req, null));
router.on("POST", "/admin/categories/new", async ({ req }) => adminSaveCategory(req.env, req, null));
router.on("GET", "/admin/categories/:id", async ({ req, params }) => adminEditCategoryPage(req.env, req, params.id));
router.on("POST", "/admin/categories/:id", async ({ req, params }) => adminSaveCategory(req.env, req, params.id));
router.on("GET", "/admin/countries", async ({ req }) => adminListPage(req.env, req, "countries"));
router.on("GET", "/admin/countries/new", async ({ req }) => adminEditCountryPage(req.env, req, null));
router.on("POST", "/admin/countries/new", async ({ req }) => adminSaveCountry(req.env, req, null));
router.on("GET", "/admin/countries/:id", async ({ req, params }) => adminEditCountryPage(req.env, req, params.id));
router.on("POST", "/admin/countries/:id", async ({ req, params }) => adminSaveCountry(req.env, req, params.id));
router.on("GET", "/admin/operators", async ({ req }) => adminListPage(req.env, req, "operators"));
router.on("GET", "/admin/operators/new", async ({ req }) => adminEditOperatorPage(req.env, req, null));
router.on("POST", "/admin/operators/new", async ({ req }) => adminSaveOperator(req.env, req, null));
router.on("GET", "/admin/operators/:id", async ({ req, params }) => adminEditOperatorPage(req.env, req, params.id));
router.on("POST", "/admin/operators/:id", async ({ req, params }) => adminSaveOperator(req.env, req, params.id));
router.on("GET", "/admin/products", async ({ req }) => adminListPage(req.env, req, "products"));
router.on("GET", "/admin/products/new", async ({ req }) => adminEditProductPage(req.env, req, null));
router.on("POST", "/admin/products/new", async ({ req }) => adminSaveProduct(req.env, req, null));
router.on("GET", "/admin/products/:id", async ({ req, params }) => adminEditProductPage(req.env, req, params.id));
router.on("POST", "/admin/products/:id", async ({ req, params }) => adminSaveProduct(req.env, req, params.id));
router.on("GET", "/admin/posts", async ({ req }) => adminListPage(req.env, req, "posts"));
router.on("GET", "/admin/posts/new", async ({ req }) => adminEditPostPage(req.env, req, null));
router.on("POST", "/admin/posts/new", async ({ req }) => adminSavePost(req.env, req, null));
router.on("GET", "/admin/posts/:id", async ({ req, params }) => adminEditPostPage(req.env, req, params.id));
router.on("POST", "/admin/posts/:id", async ({ req, params }) => adminSavePost(req.env, req, params.id));
router.on("GET", "/admin/import-export", async ({ req }) => adminImportExportPage(req.env, req));
router.on("GET", "/admin/media", async ({ req }) => {
  const env = req.env;
  const url = new URL(req.url);
  const uploaded = url.searchParams.get("uploaded") ?? void 0;
  return adminMediaPage(env, req, uploaded);
});
router.on("POST", "/admin/media", async ({ req }) => adminMediaUpload(req.env, req));
router.on("POST", "/api/admin/auth/login", async ({ req }) => apiAdminLogin(req.env, req));
router.on("POST", "/api/admin/auth/logout", async ({ req }) => apiAdminLogout(req.env, req));
router.on("POST", "/api/admin/auth/refresh", async ({ req }) => apiAdminRefresh(req.env, req));
router.on("POST", "/api/admin/media/upload", async ({ req }) => apiAdminUpload(req.env, req));
router.on("GET", "/api/admin/export", async ({ req }) => apiAdminExport(req.env, req));
router.on("POST", "/api/admin/import", async ({ req }) => apiAdminImport(req.env, req));
router.on("GET", "/api/public/search", async ({ req }) => withApiCache(req, (env) => apiPublicSearch(env, req), 60));
router.on("GET", "/api/public/country/:slug", async ({ req, params }) => withApiCache(req, (env) => apiPublicCountry(env, params.slug), 120));
router.on("GET", "/api/public/operator/:slug", async ({ req, params }) => withApiCache(req, (env) => apiPublicOperator(env, params.slug), 120));
router.on("GET", "/robots.txt", async ({ req }) => robotsTxt(req.env));
router.on("GET", "/sitemap.xml", async ({ req }) => sitemapXml(req.env));
router.on("GET", "/media/:key", async ({ req, params }) => {
  const env = req.env;
  const r = await getObjectResponse(env, params.key);
  return r ?? notFound();
});
async function withHtmlCache(req, render) {
  const env = req.env;
  const url = new URL(req.url);
  const bypass = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
  if (!bypass) {
    const locale = resolveLocale(req);
    const cacheUrl = new URL(req.url);
    cacheUrl.searchParams.set("__hl", locale);
    const cacheKey = new Request(cacheUrl.toString());
    const hit = await cacheGet(cacheKey);
    if (hit) return hit;
    const res = await render(env);
    await cachePut(cacheKey, res.clone(), 60);
    return res;
  }
  return render(env);
}
async function withApiCache(req, handle, ttlSeconds) {
  const env = req.env;
  const hit = await cacheGet(req);
  if (hit) return hit;
  const res = await handle(env);
  await cachePut(req, res.clone(), ttlSeconds);
  return res;
}
async function incr(env, key) {
  const v = await env.KV.get(key);
  const n = (v ? parseInt(v, 10) : 0) + 1;
  await env.KV.put(key, String(n));
}
var index_default = {
  async fetch(req, env, ctx) {
    ;
    req.env = env;
    ctx.waitUntil(bootstrapAdminIfNeeded(env));
    const url = new URL(req.url);
    if (req.method === "GET") {
      if (url.pathname.startsWith("/country/")) ctx.waitUntil(incr(env, `views:country:${url.pathname.slice("/country/".length)}`));
      if (url.pathname.startsWith("/operator/")) ctx.waitUntil(incr(env, `views:operator:${url.pathname.slice("/operator/".length)}`));
      if (url.pathname.startsWith("/product/")) ctx.waitUntil(incr(env, `views:product:${url.pathname.slice("/product/".length)}`));
    }
    const res = await router.route(req);
    return res ?? notFound();
  },
  async scheduled(event, env, ctx) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const publish = async (table) => {
      await env.DB.prepare(
        `UPDATE ${table} SET status='published', published_at=?, updated_at=? WHERE status='scheduled' AND publish_at IS NOT NULL AND publish_at <= ?`
      ).bind(now, now, now).run();
    };
    ctx.waitUntil(Promise.all([publish("countries"), publish("operators"), publish("products"), publish("posts")]).then(() => void 0));
  }
};
export {
  index_default as default
};
/*! Bundled license information:

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
