import crypto from 'node:crypto'
import { extractKeywords, reorderByKeywords, scoreText } from './keywordExtract.mjs'
import { getProfileLabel, sortWorkChronologically } from './profileWeights.mjs'
import {
  cleanResumeSummary,
  finalizeGeneratedResume,
  GENERATION_STANDARDS_VERSION,
  normalizeDisplayTitle,
  prepareResumeForGeneration,
} from './resumeGenerationStandards.mjs'

/**
 * 根据 JD 优化简历：重排亮点/技能、微调简介与标题
 * @param {object} baseResume
 * @param {object} job
 * @param {{ profile?: string }} [options]
 * @returns {{ resume: object, meta: object }}
 */
export function optimizeResumeForJob(baseResume, job, options = {}) {
  const profile = options.profile ?? 'business-expert'
  const preparedResume = prepareResumeForGeneration(baseResume, options.profileData)
  const jdText = [job.title, job.company, job.description, job.requirements]
    .filter(Boolean)
    .join('\n')

  const keywords = extractKeywords(jdText)
  const allResumeText = JSON.stringify(preparedResume)
  const overall = scoreText(allResumeText, keywords)
  const matchScore = keywords.length
    ? Math.round((overall.matched.length / keywords.length) * 100)
    : 0

  const missingKeywords = keywords.filter(
    (kw) => !allResumeText.toLowerCase().includes(kw.toLowerCase()),
  )

  const tailoredTitle = normalizeDisplayTitle(preparedResume.basicInfo?.title)
  const tailoredSummary = cleanResumeSummary(preparedResume.summary)

  let workExperiences = (preparedResume.workExperiences ?? []).map((work) => ({
    ...work,
    highlights: reorderByKeywords(work.highlights ?? [], keywords),
    description: work.description,
    detail: work.detail
      ? {
          ...work.detail,
          achievements: reorderByKeywords(work.detail.achievements ?? [], keywords),
          responsibilities: reorderByKeywords(work.detail.responsibilities ?? [], keywords),
          projects: (work.detail.projects ?? []).map((proj) => ({
            ...proj,
            highlights: reorderByKeywords(proj.highlights ?? [], keywords),
          })),
        }
      : undefined,
  }))

  workExperiences = sortWorkChronologically(workExperiences)

  const projectExperiences = (preparedResume.projectExperiences ?? [])
    .map((proj) => ({
      ...proj,
      highlights: reorderByKeywords(proj.highlights ?? [], keywords),
    }))
    .sort((a, b) => {
      const scoreA = scoreText(JSON.stringify(a), keywords).score
      const scoreB = scoreText(JSON.stringify(b), keywords).score
      return scoreB - scoreA
    })

  const skillGroups = (preparedResume.skillGroups ?? [])
    .map((group) => ({
      ...group,
      items: reorderByKeywords(group.items ?? [], keywords),
      _score: scoreText((group.items ?? []).join(' '), keywords).score,
    }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...group }) => group)

  const selfEvaluation = reorderByKeywords(preparedResume.selfEvaluation ?? [], keywords)

  const suggestions = buildSuggestions(missingKeywords, matchScore, job, profile)

  const resume = finalizeGeneratedResume({
    ...preparedResume,
    basicInfo: {
      ...preparedResume.basicInfo,
      title: tailoredTitle,
    },
    summary: tailoredSummary,
    workExperiences,
    projectExperiences,
    skillGroups,
    selfEvaluation,
  })

  return {
    resume,
    meta: {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      profile,
      profileLabel: getProfileLabel(profile),
      matchScore,
      matchedKeywords: overall.matched,
      missingKeywords: missingKeywords.slice(0, 15),
      extractedKeywords: keywords.slice(0, 30),
      suggestions,
      standardsVersion: GENERATION_STANDARDS_VERSION,
      optimizedAt: new Date().toISOString(),
    },
  }
}

function buildSuggestions(missingKeywords, matchScore, job, profile) {
  const suggestions = []
  const profileLabel = getProfileLabel(profile)

  if (matchScore >= 75) {
    suggestions.push(`【${profileLabel}】匹配度较高，可直接投递；建议导出定制版 Word + 求职信。`)
  } else if (matchScore >= 50) {
    suggestions.push(`【${profileLabel}】匹配度中等，已按方向重排亮点；建议查看面试准备中的缺口问题。`)
  } else {
    suggestions.push(`【${profileLabel}】匹配度偏低，建议评估是否投递或调整求职方向。`)
  }

  if (missingKeywords.length) {
    suggestions.push(
      `JD 强调但简历未覆盖的关键词：${missingKeywords.slice(0, 8).join('、')}。可在对应经历中自然融入。`,
    )
  }

  if (job.title?.includes('自动化') || job.description?.includes('自动化')) {
    suggestions.push('该岗位侧重自动化，建议突出 ADB/Midscene/脚本工具平台相关经历。')
  }

  if (profile === 'business-expert') {
    suggestions.push('业务专家向：面试多讲玩法理解、危机转型经历、质量与业务平衡案例。')
  } else if (profile === 'platform') {
    suggestions.push('平台向：突出智能工具 Agent 体系与业务驱动提效，避免只堆技术名词。')
  } else if (profile === 'management') {
    suggestions.push('管理向：突出撕歌/云测带团队经历、发版节奏与客户交付。')
  }

  return suggestions
}

export function createVariantRecord(baseResume, job, optimized) {
  return {
    id: crypto.randomUUID(),
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    matchScore: optimized.meta.matchScore,
    resume: optimized.resume,
    meta: optimized.meta,
    createdAt: new Date().toISOString(),
  }
}
