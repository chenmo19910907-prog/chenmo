import type { WorkExperience } from '../types/resume'
import { polishWebText } from './readableResumeText'

/** 个人网站展示用：润色工作经历全文案，不修改本地存储数据 */
export function polishWorkForWeb(work: WorkExperience): WorkExperience {
  const polished: WorkExperience = {
    ...work,
    description: polishWebText(work.description),
    highlights: work.highlights.map(polishWebText),
  }

  if (!work.detail) return polished

  const detail = work.detail
  return {
    ...polished,
    detail: {
      ...detail,
      tagline: detail.tagline ? polishWebText(detail.tagline) : detail.tagline,
      teamInfo: detail.teamInfo ? polishWebText(detail.teamInfo) : detail.teamInfo,
      businessOverview: polishWebText(detail.businessOverview),
      businessPoints: detail.businessPoints.map(polishWebText),
      responsibilities: detail.responsibilities.map(polishWebText),
      achievements: detail.achievements.map(polishWebText),
      platformAgentSummary: detail.platformAgentSummary
        ? polishWebText(detail.platformAgentSummary)
        : detail.platformAgentSummary,
      projects: detail.projects.map((project) => ({
        ...project,
        name: polishWebText(project.name),
        description: polishWebText(project.description),
        highlights: (project.highlights ?? []).map(polishWebText),
      })),
    },
  }
}
