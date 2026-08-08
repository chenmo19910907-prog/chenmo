const PUBLIC_PREVIEW_KEY = 'chenmo-public-preview'

/** 浏览器端判断是否为本机访问 */
export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  )
}

/** 根据 URL 参数同步外网预览状态（view=public 开启，view=local 关闭） */
export function syncPublicPreviewFromUrl(search = ''): void {
  if (typeof window === 'undefined') return
  const view = new URLSearchParams(search).get('view')
  if (view === 'public') {
    sessionStorage.setItem(PUBLIC_PREVIEW_KEY, '1')
    return
  }
  if (view === 'local') {
    sessionStorage.removeItem(PUBLIC_PREVIEW_KEY)
  }
}

/** 是否处于本机模拟外网预览（隐藏编辑与本机专属导航） */
export function isPublicPreviewMode(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(PUBLIC_PREVIEW_KEY) === '1'
}

export function getPublicPreviewUrl(path = '/'): string {
  if (typeof window === 'undefined') return `${path}?view=public`
  const url = new URL(path, window.location.origin)
  url.searchParams.set('view', 'public')
  return url.toString()
}

export function isLocalClientAccess(): boolean {
  if (typeof window === 'undefined') return false
  return isLocalHostname(window.location.hostname) && !isPublicPreviewMode()
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
