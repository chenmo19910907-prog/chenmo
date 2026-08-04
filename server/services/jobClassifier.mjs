/** 常见外包 / 人力服务公司 */
const OUTSOURCING_COMPANIES = [
  '云测',
  '博彦',
  '中软',
  '文思',
  '软通',
  '法本',
  '中科创达',
  '人瑞',
  '科锐',
  '万宝盛华',
  '东软',
  '海辉',
  '诚迈',
  '拓维',
  '华胜',
  '微创',
  '亿达',
  '中电金信',
  '启明',
  '讯锡',
  '外企德科',
  '佩琪',
  '任仕达',
]

/** JD / 标题中的外包信号词 */
const OUTSOURCING_KEYWORDS = [
  '外包',
  '外派',
  '驻场',
  '人力外包',
  '劳务派遣',
  '项目外包',
  '测试外包',
  '人力服务',
  '外协',
  'ITO',
  'BPO',
  '项目制',
  '驻场开发',
  '驻场测试',
]

/** 知名甲方（出现外包关键词但公司为甲方时降权） */
const DIRECT_EMPLOYERS = [
  '字节',
  '腾讯',
  '阿里',
  '网易',
  '快手',
  '百度',
  '美团',
  '滴滴',
  '小米',
  '陌陌',
  '挚文',
  '哔哩',
  '小红书',
  '米哈游',
  '叠纸',
  '趣加',
  '华为',
  '京东',
  '拼多多',
]

/**
 * @param {object} job
 * @returns {{ isOutsourcing: boolean, confidence: 'likely' | 'possible' | 'direct', reason: string }}
 */
export function detectOutsourcing(job) {
  const text = `${job.company} ${job.title} ${job.description ?? ''} ${job.requirements ?? ''}`

  for (const name of OUTSOURCING_COMPANIES) {
    if (text.includes(name)) {
      return {
        isOutsourcing: true,
        confidence: 'likely',
        reason: `外包服务商：${name}`,
      }
    }
  }

  const hitKeywords = OUTSOURCING_KEYWORDS.filter((kw) => text.includes(kw))
  if (hitKeywords.length > 0) {
    const isDirect = DIRECT_EMPLOYERS.some((emp) => job.company.includes(emp))
    if (isDirect && hitKeywords.length === 1 && hitKeywords[0] === '驻场') {
      return {
        isOutsourcing: false,
        confidence: 'possible',
        reason: `含「${hitKeywords[0]}」但公司为知名甲方，可能为驻场协作`,
      }
    }
    return {
      isOutsourcing: true,
      confidence: hitKeywords.length >= 2 ? 'likely' : 'possible',
      reason: `关键词：${hitKeywords.slice(0, 3).join('、')}`,
    }
  }

  return { isOutsourcing: false, confidence: 'direct', reason: '' }
}

/**
 * @param {number | undefined} score
 * @returns {'high' | 'medium' | 'low' | 'unknown'}
 */
export function getMatchTier(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

/**
 * @param {object} job
 * @param {{ isOutsourcing?: boolean, isOutsourcingManual?: boolean }} [patch]
 */
export function enrichJob(job, patch = {}) {
  const merged = { ...job, ...patch }
  const detection = detectOutsourcing(merged)

  const isOutsourcing =
    merged.isOutsourcingManual === true
      ? Boolean(merged.isOutsourcing)
      : detection.isOutsourcing

  return {
    ...merged,
    isOutsourcing,
    outsourcingConfidence: merged.isOutsourcingManual
      ? isOutsourcing
        ? 'likely'
        : 'direct'
      : detection.confidence,
    outsourcingReason: merged.isOutsourcingManual
      ? merged.outsourcingReason || (isOutsourcing ? '手动标注' : '')
      : detection.reason,
  }
}

export function enrichJobs(jobs) {
  return (jobs ?? []).map((job) => enrichJob(job))
}
