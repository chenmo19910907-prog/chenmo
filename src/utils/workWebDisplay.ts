import type { WorkExperience } from '../types/resume'
import { polishWebText } from './readableResumeText'

/** 个人网站工作卡片概述 */
export function getWorkCardSummary(work: WorkExperience): string {
  const tagline = work.detail?.tagline?.trim()
  const description = work.description?.trim()
  return polishWebText(tagline || description || '')
}

export function formatWorkPeriod(work: WorkExperience): string {
  return `${work.startDate} — ${work.endDate}`
}
