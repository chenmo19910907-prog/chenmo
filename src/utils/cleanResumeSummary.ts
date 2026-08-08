/** 去掉优化器历史拼接的职位后缀 */
export function normalizeDisplayTitle(title: string): string {
  if (!title) return title

  return title
    .replace(/\s*·\s*自动化\s*$/u, '')
    .replace(/\s*·\s*海外\s*$/u, '')
    .replace(/\s*·\s*测试组长\s*$/u, '')
    .replace(/\s*\/\s*自动化\s*$/u, '')
    .trim()
}

/** 展示/导出前去掉优化器历史遗留的「核心匹配」与目标岗位尾注 */
export function cleanResumeSummary(summary: string): string {
  if (!summary) return summary

  return summary
    .replace(/^核心匹配：[^\n。]+[。\n]?\s*/m, '')
    .replace(/（目标岗位：[^）]+）\s*$/m, '')
    .trim()
}
