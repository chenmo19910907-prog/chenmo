/** 与 server/services/resumeGenerationStandards.mjs 保持一致的客户端规范 */
/** Word 导出版式见 {@link ./resumeExportStandards.ts} */

const SUMMARY_PARAGRAPH_ORDER = ['experience', 'platform', 'achievement', 'other'] as const

export function normalizeDisplayTitle(title = ''): string {
  if (!title) return title

  return title
    .replace(/\s*·\s*自动化\s*$/u, '')
    .replace(/\s*·\s*海外\s*$/u, '')
    .replace(/\s*·\s*测试组长\s*$/u, '')
    .replace(/\s*\/\s*自动化\s*$/u, '')
    .trim()
}

export function cleanResumeSummary(summary = ''): string {
  if (!summary) return summary

  return summary
    .replace(/^核心匹配：[^\n。]+[。\n]?\s*/m, '')
    .replace(/（目标岗位：[^）]+）\s*$/m, '')
    .trim()
}

function classifySummaryParagraph(paragraph: string): (typeof SUMMARY_PARAGRAPH_ORDER)[number] {
  if (/^\d+\s*年|语音房社交业务测试经验|历任.+负责人|现任.+测试/.test(paragraph)) {
    return 'experience'
  }
  if (/Cursor|业务智能工具平台|Agent|平台化/.test(paragraph)) {
    return 'platform'
  }
  if (/帧趣阶段|年流水|房间玩法|高频发版/.test(paragraph)) {
    return 'achievement'
  }
  return 'other'
}

export function orderSummaryParagraphs(paragraphs: string[]): string[] {
  return [...paragraphs].sort((left, right) => {
    const leftRank = SUMMARY_PARAGRAPH_ORDER.indexOf(classifySummaryParagraph(left))
    const rightRank = SUMMARY_PARAGRAPH_ORDER.indexOf(classifySummaryParagraph(right))
    return leftRank - rightRank
  })
}

export function buildSummaryFromAbout(about: string[]): string {
  const paragraphs = about.map((item) => item.trim()).filter(Boolean)
  if (paragraphs.length === 0) return ''
  return orderSummaryParagraphs(paragraphs).join('\n')
}
