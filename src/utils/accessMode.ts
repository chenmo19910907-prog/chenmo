/** 浏览器端判断是否为本机访问 */
export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  )
}

export function isLocalClientAccess(): boolean {
  if (typeof window === 'undefined') return false
  return isLocalHostname(window.location.hostname)
}

export function getPublicSiteUrl(): string {
  if (typeof window === 'undefined') return ''
  const { protocol, host } = window.location
  if (isLocalHostname(window.location.hostname)) {
    return `${protocol}//${host.replace(/localhost|127\.0\.0\.1/, 'your-domain.com')}`
  }
  return `${protocol}//${host}`
}

export function getResumePublicUrl(variantId: string): string {
  if (typeof window === 'undefined') return `/r/${variantId}`
  return `${window.location.origin}/r/${variantId}`
}
