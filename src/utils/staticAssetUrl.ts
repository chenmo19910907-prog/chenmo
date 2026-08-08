/** 解析 public 目录或站点根路径下的静态资源 URL */
export function staticAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${base}${path.replace(/^\//, '')}`
}
