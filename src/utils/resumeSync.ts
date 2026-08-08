import type { PersonalProfile } from '../types/profile'
import type { Resume } from '../types/resume'
import { buildSummaryFromAbout, normalizeDisplayTitle } from './resumeGenerationStandards'
import { loadProfile } from './storage'

/** 将个人介绍页的最新信息合并进主简历（遵循简历生成规范） */
export function applyProfileToResume(
  resume: Resume,
  profile: PersonalProfile = loadProfile(),
): Resume {
  const aboutText = buildSummaryFromAbout(profile.about)

  return {
    ...resume,
    basicInfo: {
      ...resume.basicInfo,
      name: profile.name,
      title: normalizeDisplayTitle(profile.title),
      phone: profile.contact.phone ?? resume.basicInfo.phone,
      email: profile.contact.email ?? resume.basicInfo.email,
      location: profile.contact.location ?? resume.basicInfo.location,
      degree: profile.contact.degree ?? resume.basicInfo.degree,
    },
    summary: aboutText || resume.summary,
  }
}

/** 将外网主页地址写入简历「个人网站」字段 */
export function applyPublicSiteUrl(
  resume: Resume,
  publicSiteUrl?: string,
  options?: { force?: boolean },
): Resume {
  const url = publicSiteUrl?.trim()
  if (!url) return resume
  if (!options?.force && resume.basicInfo.website?.trim()) return resume

  return {
    ...resume,
    basicInfo: {
      ...resume.basicInfo,
      website: url,
    },
  }
}
