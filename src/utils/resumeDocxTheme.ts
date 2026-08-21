/**
 * Word 导出主题常量（实现层）
 * @see ./resumeExportStandards.ts 完整版式规范
 */
import { LineRuleType, TextRun } from 'docx'
import type { DocxResumeTheme } from '../templates/docxThemes'
import { RESUME_EXPORT_SPEC } from './resumeExportStandards'

/** 与 src/index.css、ResumeView 预览一致 */
export const RESUME_FONT = {
  name: RESUME_EXPORT_SPEC.font,
  eastAsia: RESUME_EXPORT_SPEC.font,
  ascii: RESUME_EXPORT_SPEC.font,
  hAnsi: RESUME_EXPORT_SPEC.font,
  cs: RESUME_EXPORT_SPEC.font,
} as const

/** docx 字号单位为半磅；约等于预览 px × 1.5 */
export const RESUME_SIZE = RESUME_EXPORT_SPEC.fontSize

export const RESUME_COLOR = {
  heading: RESUME_EXPORT_SPEC.color.heading,
  title: RESUME_EXPORT_SPEC.color.title,
  body: RESUME_EXPORT_SPEC.color.body,
  muted: RESUME_EXPORT_SPEC.color.muted,
  section: RESUME_EXPORT_SPEC.color.section,
  link: RESUME_EXPORT_SPEC.color.link,
} as const

/** 正文行距（约 1.05 倍行高，240 twips = 单倍行距） */
export const BODY_LINE_SPACING = {
  line: RESUME_EXPORT_SPEC.bodyLineSpacing.line,
  lineRule: LineRuleType.AUTO,
} as const

/** 正文字间距（twips，负值收紧） */
export const BODY_CHARACTER_SPACING = RESUME_EXPORT_SPEC.bodyCharacterSpacing

/** 段落/区块间距（twips，20 twips ≈ 1pt） */
export const PARAGRAPH_SPACING = RESUME_EXPORT_SPEC.spacing

/** 预览 bg-blue-500/70 圆点 */
export const RESUME_BULLET = {
  char: RESUME_EXPORT_SPEC.bullet.char,
  color: RESUME_EXPORT_SPEC.bullet.color,
  size: RESUME_EXPORT_SPEC.bullet.size,
} as const

export function resumeRun({
  text,
  size = RESUME_SIZE.body,
  bold = false,
  italics = false,
  color = RESUME_COLOR.body,
  underline,
  characterSpacing = BODY_CHARACTER_SPACING,
}: {
  text: string
  size?: number
  bold?: boolean
  italics?: boolean
  color?: string
  underline?: Record<string, never>
  characterSpacing?: number
}): TextRun {
  return new TextRun({
    text,
    size,
    bold,
    italics,
    color,
    underline,
    font: RESUME_FONT,
    ...(characterSpacing !== 0 ? { characterSpacing } : {}),
  })
}

export function createResumeDocumentStyles(theme: DocxResumeTheme) {
  return {
    default: {
      document: {
        run: {
          font: RESUME_FONT,
          size: RESUME_SIZE.body,
          color: theme.body,
          characterSpacing: BODY_CHARACTER_SPACING,
        },
        paragraph: {
          spacing: BODY_LINE_SPACING,
        },
      },
    },
  }
}

/** @deprecated 请使用 createResumeDocumentStyles(theme) */
export const resumeDocumentStyles = createResumeDocumentStyles({
  layout: 'standard',
  heading: RESUME_COLOR.heading,
  title: RESUME_COLOR.title,
  body: RESUME_COLOR.body,
  muted: RESUME_COLOR.muted,
  section: RESUME_COLOR.section,
  link: RESUME_COLOR.link,
  sectionBar: RESUME_EXPORT_SPEC.color.sectionBar,
  headerDivider: RESUME_EXPORT_SPEC.color.headerDivider,
  bullet: RESUME_EXPORT_SPEC.color.bullet,
})
