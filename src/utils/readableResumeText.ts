const KEEP_PAREN_CONTENT =
  /^(陌陌|撕歌|直播|游道易|Yodo1|Rodeo|TEW|核心|Cursor|冰河时代|3\.|ARBS|VIP)/

function softenParentheses(text: string): string {
  return text.replace(/（([^）]+)）/g, (full, inner) => {
    const trimmed = inner.trim()
    if (KEEP_PAREN_CONTENT.test(trimmed)) return full
    if (/^\d/.test(trimmed) && trimmed.includes('至')) return full
    const softened = trimmed.replace(/\//g, '、').replace(/\s*→\s*/g, '至')
    return `，${softened}，`
  })
}

/** 网页与简历展示：弱化标签冒号、箭头、斜杠等符号，提升可读性 */
export function polishWebText(text: string): string {
  if (!text) return text

  let result = text
    .replace(/[「」《》]/g, '')
    .replace(/(\d[\d.]*)\s*[–—→]\s*(\d[\d.]*)/g, '$1 至 $2')
    .replace(/\s*→\s*/g, '，')
    .replace(/——|―/g, '，')
    .replace(/(?<=[\u4e00-\u9fa5A-Za-z0-9）])\s*\/\s*(?=[\u4e00-\u9fa5A-Za-z0-9（])/g, '、')
    .replace(/\s+\+\s+/g, '与')
    .replace(/\s*·\s*/g, '，')

  result = softenParentheses(result)

  return result
    .replace(/^([^\n：]{2,14})：/gm, '$1，')
    .replace(/；/g, '。')
    .replace(/，{2,}/g, '，')
    .replace(/。\s*，/g, '。')
    .replace(/^，+|，+$/g, '')
    .trim()
}

export function toReadableResumeText(text: string): string {
  return polishWebText(text)
}

/** 将个人简介拆成多段：优先按换行，否则按句号、分号分段 */
export function splitSummaryParagraphs(text: string): string[] {
  const normalized = text.trim()
  if (!normalized) return []

  const byNewline = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (byNewline.length > 1) return byNewline

  const bySentence = normalized
    .split(/(?<=[。；])\s*/)
    .map((line) => line.trim())
    .filter(Boolean)

  return bySentence.length > 1 ? bySentence : [normalized]
}
