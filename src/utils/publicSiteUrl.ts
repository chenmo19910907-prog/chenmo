const LEGACY_WEBSITE_PATTERN =
  /natapp|cpolar|ngrok|trycloudflare|localhost|127\.0\.0\.1|your-domain\.com/i

/** 展示用：保证链接文本带 https:// */
export function formatWebsiteDisplayUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https:\/\//i.test(trimmed)) return trimmed
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, 'https://')
  return `https://${trimmed}`
}

/** 去掉末尾斜杠，便于比较 */
export function normalizePublicSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** 是否应将个人网站字段同步为当前外网地址 */
export function shouldSyncWebsite(
  website: string | undefined,
  publicSiteUrl: string,
): boolean {
  const canonical = normalizePublicSiteUrl(publicSiteUrl)
  if (!canonical) return false

  const current = website?.trim()
  if (!current) return true

  if (normalizePublicSiteUrl(current) === canonical) return false

  return LEGACY_WEBSITE_PATTERN.test(current)
}
