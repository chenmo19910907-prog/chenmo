/** 由 docx 十六进制色值生成 Tailwind 任意值 class，保证预览与 Word 导出同色 */

export function themeTextClass(hex: string): string {
  return `text-[#${hex}]`
}

export function themeBorderClass(hex: string): string {
  return `border-[#${hex}]`
}

export function themeBgClass(hex: string): string {
  return `bg-[#${hex}]`
}

export function themeDecorationClass(hex: string): string {
  return `decoration-[#${hex}]`
}
