import { escapeHtml } from './seo'

export type HtmlMeta = {
  title: string
  description: string
  canonical: string
  ogImage?: string
  keywords?: string
  faviconHref?: string
  locale?: string
  robots?: string
  jsonLd?: unknown[]
}

export function layout(meta: HtmlMeta, body: string, criticalCss: string): string {
  const jsonLd = (meta.jsonLd ?? [])
    .map((o) => {
      const s = JSON.stringify(o).replace(/</g, '\\u003c')
      return `<script type="application/ld+json">${s}</script>`
    })
    .join('')
  const robots = meta.robots ? `<meta name="robots" content="${escapeHtml(meta.robots)}">` : ''
  const ogImage = meta.ogImage
    ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}"><meta name="twitter:image" content="${escapeHtml(meta.ogImage)}">`
    : ''
  const keywords = meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords)}">` : ''
  const favicon = meta.faviconHref ? `<link rel="icon" href="${escapeHtml(meta.faviconHref)}">` : ''
  const locale = meta.locale ?? 'en'
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
  ${keywords}
  ${favicon}
  ${robots}
  ${ogImage}
  <style>${criticalCss}</style>
  ${jsonLd}
</head>
<body>
${body}
</body>
</html>`
}

export function criticalCss(): string {
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
.editor-modal{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px}
.editor-modal[hidden]{display:none}
.editor-modal__backdrop{position:absolute;inset:0;background:rgba(22,52,77,.28);backdrop-filter:blur(4px)}
.editor-modal__panel{position:relative;z-index:1;width:min(100%,560px);display:grid;gap:14px}
.editor-modal__header{display:flex;align-items:center;justify-content:space-between;gap:12px}
.editor-modal__body{display:grid;gap:14px}
.editor-tabs{display:flex;flex-wrap:wrap;gap:8px}
.editor-tab-panel{display:grid;gap:12px}
.muted-panel{background:linear-gradient(180deg,rgba(214,236,240,.58),rgba(255,255,255,.9))}
.section-gap{display:grid;gap:20px}
.posts-page{gap:16px}
.posts-section{padding:16px 18px}
.posts-heading{margin-bottom:10px}
.posts-intro{margin-bottom:14px}
.posts-list{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.posts-item{padding:14px 0;border-top:1px solid var(--border)}
.posts-item:first-child{padding-top:0;border-top:0}
.posts-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:6px}
.posts-excerpt{margin-top:8px}
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
.content-prose ul,.content-prose ol{margin:0 0 12px;padding-left:24px}
.content-prose li{margin-bottom:8px;line-height:1.75;color:var(--muted)}
.content-prose li:last-child{margin-bottom:0}
@media (max-width:960px){
header{padding:10px 0}
main,footer{padding:16px}
.hero,.split-grid,.grid,.detail-layout{grid-template-columns:1fr}
.page-header,.hero{padding:22px}
.editor-modal{padding:16px}
.posts-section{padding:14px 16px}
header nav.nav-shell{gap:12px;padding:0 16px}
.nav-brand{min-width:0;width:100%}
.nav-links{width:100%;justify-content:flex-start}
.nav-actions{width:100%;justify-content:flex-end}
h1{font-size:2rem}
}
`
}

