/** 测试/QA 领域常见关键词库，用于 JD 匹配与简历优化 */
export const DOMAIN_KEYWORDS = [
  '功能测试',
  '回归测试',
  '自动化测试',
  '性能测试',
  '兼容性测试',
  '移动端测试',
  'iOS',
  'Android',
  '海外发版',
  'Google Play',
  'App Store',
  'TestFlight',
  '多语言',
  '本地化',
  '语音房',
  '语聊',
  '直播',
  '社交',
  '游戏测试',
  '质量保障',
  '质量负责人',
  '测试组长',
  '测试计划',
  '用例设计',
  '缺陷管理',
  '敏捷',
  'Scrum',
  'Charles',
  'ADB',
  'Jira',
  'Python',
  '脚本',
  'AI',
  'MCP',
  'Agent',
  'Midscene',
  '测试工具',
  '测试平台',
  '知识库',
  '钉钉',
  'MOA',
  '抓包',
  '风控',
  '支付',
  '内购',
  '渠道包',
  'TestRail',
  'MySQL',
  '数据校验',
  '团队管理',
  '跨部门协作',
  '需求评审',
  '发版',
  '线上问题',
  '稳定性',
  '边界场景',
  '安全测试',
  '隐私',
]

const STOP_WORDS = new Set([
  '的',
  '了',
  '和',
  '与',
  '或',
  '及',
  '等',
  '我们',
  '您',
  '你',
  '有',
  '在',
  '为',
  '对',
  '将',
  '能',
  '会',
  '可',
  '进行',
  '负责',
  '具备',
  '熟悉',
  '了解',
  '以上',
  '以下',
  '优先',
  '相关',
  '经验',
  '工作',
  '岗位',
  '职责',
  '要求',
  'the',
  'and',
  'or',
  'with',
  'for',
  'to',
  'in',
  'of',
  'a',
  'an',
])

/**
 * 从 JD 文本中提取关键词
 * @param {string} text
 * @returns {string[]}
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') return []

  const normalized = text.replace(/\s+/g, ' ').trim()
  const found = new Set()

  for (const kw of DOMAIN_KEYWORDS) {
    if (normalized.toLowerCase().includes(kw.toLowerCase())) {
      found.add(kw)
    }
  }

  const tokens = normalized
    .split(/[\s,，。；;：:、/\\|（）()\[\]【】「」""''\n\r\t]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 20 && !STOP_WORDS.has(t))

  for (const token of tokens) {
    if (/[\u4e00-\u9fff]/.test(token) || /^[A-Za-z][A-Za-z0-9.+#-]{1,}$/.test(token)) {
      found.add(token)
    }
  }

  return [...found].slice(0, 60)
}

/**
 * 计算文本与关键词列表的匹配得分
 * @param {string} text
 * @param {string[]} keywords
 * @returns {{ score: number, matched: string[] }}
 */
export function scoreText(text, keywords) {
  if (!text || !keywords.length) return { score: 0, matched: [] }

  const lower = text.toLowerCase()
  const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()))
  return {
    score: matched.length,
    matched,
  }
}

/**
 * 按匹配度对字符串数组排序（高分在前，保留原顺序作为 tie-break）
 * @param {string[]} items
 * @param {string[]} keywords
 * @returns {string[]}
 */
export function reorderByKeywords(items, keywords) {
  return [...items]
    .map((item, index) => ({
      item,
      index,
      ...scoreText(item, keywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item)
}
