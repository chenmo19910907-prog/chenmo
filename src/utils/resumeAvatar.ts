import type { BasicInfo } from '../types/resume'
import type { PersonalProfile } from '../types/profile'
import type { ResumeLayoutId } from '../templates/types'
import { staticAssetUrl } from './staticAssetUrl'

export type ResumeAvatarImageType = 'jpg' | 'png' | 'gif' | 'bmp'

export interface ResumeAvatarImageData {
  type: ResumeAvatarImageType
  data: Uint8Array
}

export interface ResumeAvatarDocxData extends ResumeAvatarImageData {
  width: number
  height: number
}

const DOCX_AVATAR_SIZE: Record<ResumeLayoutId, number> = {
  standard: 80,
  sidebar: 96,
  timeline: 72,
  magazine: 88,
  executive: 88,
  folio: 80,
  ledger: 80,
  atelier: 72,
}

export function resolveProfileAvatarUrl(profile: PersonalProfile): string | undefined {
  return profile.avatarUrl?.trim() || profile.lifePhotos?.[0]?.src?.trim() || undefined
}

export function getResumeAvatarSrc(basicInfo: BasicInfo): string | undefined {
  if (!basicInfo.showAvatar) return undefined
  const url = basicInfo.avatarUrl?.trim()
  return url || undefined
}

export function getResumeAvatarDisplayUrl(basicInfo: BasicInfo): string | undefined {
  const src = getResumeAvatarSrc(basicInfo)
  return src ? staticAssetUrl(src) : undefined
}

export function getDocxAvatarSize(layout: ResumeLayoutId): number {
  return DOCX_AVATAR_SIZE[layout]
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('头像图片读取失败'))
    img.src = src
  })
}

/** 居中裁剪 + 圆形蒙版，与预览 rounded-full + object-cover 一致 */
async function renderCircularAvatarForDocx(blob: Blob, size: number): Promise<Uint8Array> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await loadImageElement(objectUrl)
    const cropSize = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - cropSize) / 2
    const sy = (img.naturalHeight - cropSize) / 2

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('头像图片处理失败')
    }

    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]
    if (!base64) {
      throw new Error('头像图片编码失败')
    }

    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return bytes
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** 拉取并裁剪头像，供 Word 导出（圆形、保持比例） */
export async function loadResumeAvatarForDocx(
  basicInfo: BasicInfo,
  size: number,
): Promise<ResumeAvatarDocxData | null> {
  const src = getResumeAvatarSrc(basicInfo)
  if (!src) return null

  const displayUrl = staticAssetUrl(src)
  try {
    const response = await fetch(displayUrl)
    if (!response.ok) {
      console.warn('Word 导出拉取头像失败:', displayUrl, response.status)
      return null
    }

    const data = await renderCircularAvatarForDocx(await response.blob(), size)
    return {
      type: 'png',
      data,
      width: size,
      height: size,
    }
  } catch (error) {
    console.error('Word 导出处理头像异常:', error)
    return null
  }
}
