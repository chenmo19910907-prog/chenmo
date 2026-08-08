function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片读取失败'))
    img.src = src
  })
}

function fitSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

/** 压缩招聘截图，降低 base64 上传体积，避免 413 */
export async function compressImageFile(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<{ preview: string; base64: string }> {
  const maxWidth = options?.maxWidth ?? 1280
  const maxHeight = options?.maxHeight ?? 1280
  const quality = options?.quality ?? 0.82
  const objectUrl = URL.createObjectURL(file)

  try {
    const img = await loadImage(objectUrl)
    const { width, height } = fitSize(img.width, img.height, maxWidth, maxHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('图片处理失败')
    }
    ctx.drawImage(img, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    return { preview: dataUrl, base64: dataUrl }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
