import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  emailUnique: uniqueIndex('admin_users_email_unique').on(table.email)
}))

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  slugUnique: uniqueIndex('categories_slug_unique').on(table.slug),
  parentSortIdx: index('idx_categories_parent_sort').on(table.parentId, table.sortOrder, table.name)
}))

export const countries = sqliteTable('countries', {
  id: text('id').primaryKey(),
  iso2: text('iso2').notNull(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  nameEn: text('name_en'),
  slug: text('slug').notNull(),
  heroImageKey: text('hero_image_key'),
  seoTitle: text('seo_title'),
  seoTitleZh: text('seo_title_zh'),
  seoTitleEn: text('seo_title_en'),
  seoDescription: text('seo_description'),
  seoDescriptionZh: text('seo_description_zh'),
  seoDescriptionEn: text('seo_description_en'),
  contentHtml: text('content_html'),
  contentHtmlZh: text('content_html_zh'),
  contentHtmlEn: text('content_html_en'),
  faqJson: text('faq_json'),
  status: text('status').notNull().default('draft'),
  publishAt: text('publish_at'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  iso2Unique: uniqueIndex('countries_iso2_unique').on(table.iso2),
  slugUnique: uniqueIndex('countries_slug_unique').on(table.slug),
  statusSlugIdx: index('idx_countries_status_slug').on(table.status, table.slug)
}))

export const operators = sqliteTable('operators', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  nameEn: text('name_en'),
  slug: text('slug').notNull(),
  websiteUrl: text('website_url').notNull(),
  logoImageKey: text('logo_image_key'),
  supportChannelsJson: text('support_channels_json'),
  seoTitle: text('seo_title'),
  seoTitleZh: text('seo_title_zh'),
  seoTitleEn: text('seo_title_en'),
  seoDescription: text('seo_description'),
  seoDescriptionZh: text('seo_description_zh'),
  seoDescriptionEn: text('seo_description_en'),
  contentHtml: text('content_html'),
  contentHtmlZh: text('content_html_zh'),
  contentHtmlEn: text('content_html_en'),
  faqJson: text('faq_json'),
  status: text('status').notNull().default('draft'),
  publishAt: text('publish_at'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  slugUnique: uniqueIndex('operators_slug_unique').on(table.slug),
  statusSlugIdx: index('idx_operators_status_slug').on(table.status, table.slug)
}))

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  operatorId: text('operator_id').notNull(),
  categoryId: text('category_id'),
  countryIso2: text('country_iso2').notNull(),
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  nameEn: text('name_en'),
  slug: text('slug').notNull(),
  dataGb: real('data_gb'),
  days: integer('days').notNull(),
  isUnlimited: integer('is_unlimited').notNull().default(0),
  supportsHotspot: integer('supports_hotspot').notNull().default(1),
  networkType: text('network_type'),
  priceAmount: real('price_amount').notNull(),
  priceCurrency: text('price_currency').notNull(),
  purchaseUrl: text('purchase_url').notNull(),
  coverageRegionsJson: text('coverage_regions_json'),
  activationGuideHtml: text('activation_guide_html'),
  activationGuideHtmlZh: text('activation_guide_html_zh'),
  activationGuideHtmlEn: text('activation_guide_html_en'),
  status: text('status').notNull().default('draft'),
  publishAt: text('publish_at'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  slugUnique: uniqueIndex('products_slug_unique').on(table.slug),
  countryStatusPriceIdx: index('idx_products_country_status_price').on(table.countryIso2, table.status, table.priceAmount),
  operatorIdx: index('idx_products_operator').on(table.operatorId, table.status)
}))

export const stocks = sqliteTable('stocks', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  inStock: integer('in_stock').notNull().default(1),
  stockNote: text('stock_note'),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  productIdx: index('idx_stocks_product').on(table.productId)
}))

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  categoryId: text('category_id'),
  postType: text('post_type').notNull(),
  refSlug: text('ref_slug'),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  excerpt: text('excerpt'),
  contentHtml: text('content_html').notNull(),
  coverImageKey: text('cover_image_key'),
  locale: text('locale').notNull().default('en'),
  status: text('status').notNull().default('draft'),
  publishAt: text('publish_at'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  typeLocaleStatusIdx: index('idx_posts_type_locale_status').on(table.postType, table.locale, table.status, table.publishAt),
  categoryStatusIdx: index('idx_posts_category_status').on(table.categoryId, table.status, table.publishAt),
  slugLocaleUnique: uniqueIndex('idx_posts_slug_locale_unique').on(table.slug, table.locale)
}))

export const revisions = sqliteTable('revisions', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  version: integer('version').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  actorUserId: text('actor_user_id'),
  createdAt: text('created_at').notNull()
}, (table) => ({
  entityIdx: index('idx_revisions_entity').on(table.entityType, table.entityId, table.version)
}))

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  detailJson: text('detail_json'),
  createdAt: text('created_at').notNull()
}, (table) => ({
  entityTimeIdx: index('idx_audit_entity_time').on(table.entityType, table.entityId, table.createdAt)
}))

export const siteSettings = sqliteTable('site_settings', {
  id: text('id').primaryKey(),
  siteTitle: text('site_title'),
  siteKeywords: text('site_keywords'),
  tagline: text('tagline'),
  logoImageKey: text('logo_image_key'),
  faviconImageKey: text('favicon_image_key'),
  updatedAt: text('updated_at').notNull(),
  siteTitleZh: text('site_title_zh'),
  siteTitleEn: text('site_title_en'),
  siteKeywordsZh: text('site_keywords_zh'),
  siteKeywordsEn: text('site_keywords_en'),
  taglineZh: text('tagline_zh'),
  taglineEn: text('tagline_en')
})
