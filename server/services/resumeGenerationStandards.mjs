import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROFILE_PATH = path.join(__dirname, '../../src/data/profile.json')

/** 简历生成规范版本；调整段落顺序等规则时递增 */
export const GENERATION_STANDARDS_VERSION = 1

/**
 * 简历生成规范（与个人介绍页保持一致）：
 * 1. 个人简介三段顺序：履历经验 → 平台能力 → 核心业绩
 * 2. 禁止拼接「核心匹配：」前缀与「（目标岗位：…）」尾注
 * 3. 职位标题去掉「· 自动化」等历史后缀
 * 4. 工作经历保留 displayCompany，详情页 tagline/teamInfo 与职位分工明确
 * 5. 个人主页写入 basicInfo.website，不追加为简介第四段
 */

const SUMMARY_PARAGRAPH_ORDER = ['experience', 'platform', 'achievement', 'other']

export function normalizeDisplayTitle(title = '') {
  if (!title) return title

  return title
    .replace(/\s*·\s*自动化\s*$/u, '')
    .replace(/\s*·\s*海外\s*$/u, '')
    .replace(/\s*·\s*测试组长\s*$/u, '')
    .replace(/\s*\/\s*自动化\s*$/u, '')
    .trim()
}

export function cleanResumeSummary(summary = '') {
  if (!summary) return summary

  return summary
    .replace(/^核心匹配：[^\n。]+[。\n]?\s*/m, '')
    .replace(/（目标岗位：[^）]+）\s*$/m, '')
    .trim()
}

export function splitSummaryParagraphs(summary = '') {
  return cleanResumeSummary(summary)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !/^个人主页：/.test(paragraph))
}

function classifySummaryParagraph(paragraph) {
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

export function orderSummaryParagraphs(paragraphs) {
  return [...paragraphs].sort((left, right) => {
    const leftRank = SUMMARY_PARAGRAPH_ORDER.indexOf(classifySummaryParagraph(left))
    const rightRank = SUMMARY_PARAGRAPH_ORDER.indexOf(classifySummaryParagraph(right))
    return leftRank - rightRank
  })
}

export function buildSummaryFromAbout(about = []) {
  const paragraphs = (Array.isArray(about) ? about : []).map((item) => item?.trim()).filter(Boolean)
  if (paragraphs.length === 0) return ''
  return orderSummaryParagraphs(paragraphs).join('\n')
}

export function loadDefaultProfile() {
  try {
    return JSON.parse(readFileSync(PROFILE_PATH, 'utf8'))
  } catch {
    return null
  }
}

export function mergeProfileIntoResume(resume, profile = loadDefaultProfile()) {
  if (!resume || !profile) return resume

  const summary =
    buildSummaryFromAbout(profile.about) ||
    cleanResumeSummary(resume.summary ?? '')

  return {
    ...resume,
    basicInfo: {
      ...resume.basicInfo,
      name: profile.name ?? resume.basicInfo?.name,
      title: normalizeDisplayTitle(profile.title ?? resume.basicInfo?.title ?? ''),
      phone: profile.contact?.phone ?? resume.basicInfo?.phone,
      email: profile.contact?.email ?? resume.basicInfo?.email,
      location: profile.contact?.location ?? resume.basicInfo?.location,
      degree: profile.contact?.degree ?? resume.basicInfo?.degree,
    },
    summary,
  }
}

function normalizeWorkExperience(work) {
  return {
    ...work,
    position: work.position?.trim() ?? work.position,
    displayCompany: work.displayCompany?.trim() || work.company,
    detail: work.detail
      ? {
          ...work.detail,
          tagline: work.detail.tagline?.trim(),
          teamInfo: work.detail.teamInfo?.trim(),
        }
      : work.detail,
  }
}

export function finalizeGeneratedResume(resume) {
  if (!resume) return resume

  const summary = orderSummaryParagraphs(splitSummaryParagraphs(resume.summary ?? '')).join('\n')

  return {
    ...resume,
    basicInfo: {
      ...resume.basicInfo,
      title: normalizeDisplayTitle(resume.basicInfo?.title ?? ''),
    },
    summary,
    workExperiences: (resume.workExperiences ?? []).map(normalizeWorkExperience),
  }
}

/** 生成前：合并个人介绍页最新文案并规范化 */
export function prepareResumeForGeneration(resume, profile = loadDefaultProfile()) {
  return finalizeGeneratedResume(mergeProfileIntoResume(resume, profile))
}
