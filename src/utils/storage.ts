import type { LifePhoto, PersonalProfile } from '../types/profile'
import type { Resume, SkillGroup, WorkExperience } from '../types/resume'
import defaultProfile from '../data/profile.json'
import defaultResume from '../data/resume.json'
import { buildSummaryFromAbout } from './resumeGenerationStandards'

const STORAGE_KEY = 'chenmo-resume'
const PROFILE_STORAGE_KEY = 'chenmo-profile'

/** 内置「关于我」更新时递增，用于将浏览器缓存同步到最新默认文案 */
const PROFILE_CONTENT_VERSION = 8

function isStaleAbout(about: string[] | undefined): boolean {
  if (!about?.length) return true
  if (about.length >= 5) return true
  if (about[0]?.includes('使用 Cursor')) return true
  return about.some(
    (paragraph) => paragraph.includes('产品思维：') || paragraph.includes('测试思维：'),
  )
}

function buildSummaryFromProfile(profile: PersonalProfile): string {
  return buildSummaryFromAbout(profile.about)
}

function isStaleSummary(summary: string | undefined): boolean {
  if (!summary?.trim()) return true
  return (
    summary.includes('产品思维：') ||
    summary.includes('测试思维：') ||
    summary.split('\n').filter(Boolean).length >= 5
  )
}

/** 工作经历详情页头部文案更新时递增，用于将浏览器缓存同步到最新默认文案 */
const RESUME_WORK_HEADER_VERSION = 3
const RESUME_HEADER_VERSION_KEY = 'chenmo-resume-header-version'

/** 个人网站地址更新时递增，用于将浏览器缓存中的旧穿透地址同步为 GitHub Pages */
const WEBSITE_SYNC_VERSION = 1
const WEBSITE_SYNC_KEY = 'chenmo-website-sync-version'

/** 专业技能分组结构更新时递增（如回滚豆包三分类后恢复六分组） */
const RESUME_SKILL_GROUPS_VERSION = 1
const RESUME_SKILL_GROUPS_VERSION_KEY = 'chenmo-resume-skill-groups-version'

const DOUBAO_SKILL_CATEGORIES = new Set([
  '业务领域',
  '工具 · 自动化 · AI 测试',
  '软能力',
])

function isStaleSkillGroups(
  groups: SkillGroup[] | undefined,
  defaults: SkillGroup[],
): boolean {
  if (!groups?.length) return true
  if (groups.length !== defaults.length) return true
  if (groups.some((group) => DOUBAO_SKILL_CATEGORIES.has(group.category))) return true
  if (groups[0]?.id !== 'skill-1') return true
  return false
}

function syncSkillGroupsFromDefaults(
  parsed: Resume,
  defaults: Resume,
): { resume: Resume; changed: boolean } {
  try {
    const currentVersion = localStorage.getItem(RESUME_SKILL_GROUPS_VERSION_KEY)
    const versionStale = currentVersion !== String(RESUME_SKILL_GROUPS_VERSION)
    const contentStale = isStaleSkillGroups(parsed.skillGroups, defaults.skillGroups ?? [])

    if (!versionStale && !contentStale) {
      return { resume: parsed, changed: false }
    }

    localStorage.setItem(
      RESUME_SKILL_GROUPS_VERSION_KEY,
      String(RESUME_SKILL_GROUPS_VERSION),
    )

    return {
      resume: {
        ...parsed,
        skillGroups: defaults.skillGroups,
      },
      changed: true,
    }
  } catch {
    return { resume: parsed, changed: false }
  }
}

function mergeWorkExperiencesFromDefaults(
  stored: WorkExperience[],
  defaults: WorkExperience[],
): { works: WorkExperience[]; changed: boolean } {
  const defaultById = new Map(defaults.map((work) => [work.id, work]))
  let changed = false
  const works = stored.map((work) => {
    const def = defaultById.get(work.id)
    if (!def) return work

    const sameContent =
      work.description === def.description &&
      JSON.stringify(work.highlights ?? []) === JSON.stringify(def.highlights ?? []) &&
      JSON.stringify(work.detail ?? null) === JSON.stringify(def.detail ?? null)

    if (sameContent) return work
    changed = true
    return {
      ...work,
      description: def.description,
      highlights: def.highlights ?? work.highlights,
      detail: def.detail ? { ...def.detail } : work.detail,
    }
  })
  return { works, changed }
}

function syncWorkHeaderVersion(): boolean {
  try {
    const current = localStorage.getItem(RESUME_HEADER_VERSION_KEY)
    if (current === String(RESUME_WORK_HEADER_VERSION)) return false
    localStorage.setItem(RESUME_HEADER_VERSION_KEY, String(RESUME_WORK_HEADER_VERSION))
    return true
  } catch {
    return false
  }
}

function syncWebsiteFromDefaults(
  parsed: Resume,
  defaults: Resume,
): { resume: Resume; changed: boolean } {
  const canonical = defaults.basicInfo.website?.trim()
  if (!canonical) return { resume: parsed, changed: false }

  try {
    const currentVersion = localStorage.getItem(WEBSITE_SYNC_KEY)
    if (currentVersion === String(WEBSITE_SYNC_VERSION)) {
      return { resume: parsed, changed: false }
    }
    localStorage.setItem(WEBSITE_SYNC_KEY, String(WEBSITE_SYNC_VERSION))
  } catch {
    return { resume: parsed, changed: false }
  }

  const current = parsed.basicInfo.website?.trim()
  if (current === canonical) return { resume: parsed, changed: false }

  return {
    resume: {
      ...parsed,
      basicInfo: {
        ...parsed.basicInfo,
        website: canonical,
      },
    },
    changed: true,
  }
}

function mergeSkillGroups(stored: SkillGroup[], defaults: SkillGroup[]): SkillGroup[] {
  const categories = new Set(stored.map((group) => group.category))
  const missing = defaults.filter((group) => !categories.has(group.category))
  if (missing.length === 0) return stored
  return [...stored, ...missing]
}

export function loadResume(): Resume {
  const defaults = defaultResume as Resume
  const profile = loadProfile()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Resume
      const summary = isStaleSummary(parsed.summary)
        ? buildSummaryFromProfile(profile) || defaults.summary
        : parsed.summary
      const headerSyncNeeded = syncWorkHeaderVersion()
      const mergedWorks = headerSyncNeeded
        ? mergeWorkExperiencesFromDefaults(parsed.workExperiences ?? [], defaults.workExperiences ?? [])
        : { works: parsed.workExperiences ?? [], changed: false }
      const workExperiences = mergedWorks.changed
        ? mergedWorks.works
        : parsed.workExperiences ?? []
      const withSummary = { ...parsed, summary, workExperiences }
      const skillSync = syncSkillGroupsFromDefaults(withSummary, defaults)
      const websiteSync = syncWebsiteFromDefaults(skillSync.resume, defaults)
      const next = websiteSync.resume
      if (
        skillSync.changed ||
        summary !== parsed.summary ||
        mergedWorks.changed ||
        websiteSync.changed
      ) {
        saveResume(next)
        return next
      }
      return parsed.summary === summary ? parsed : next
    }
  } catch (error) {
    console.error('读取本地简历数据失败:', error)
  }
  return defaults
}

export function saveResume(resume: Resume): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resume, null, 2))
}

export function resetResume(): Resume {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(RESUME_HEADER_VERSION_KEY)
  localStorage.removeItem(WEBSITE_SYNC_KEY)
  localStorage.removeItem(RESUME_SKILL_GROUPS_VERSION_KEY)
  return defaultResume as Resume
}

export function mergeResumeSkillGroups(resume: Resume, defaults: Resume = defaultResume as Resume): Resume {
  const skillGroups = mergeSkillGroups(resume.skillGroups ?? [], defaults.skillGroups ?? [])
  if (skillGroups.length === (resume.skillGroups ?? []).length) return resume
  return { ...resume, skillGroups }
}

export function exportResumeJson(resume: Resume): void {
  const blob = new Blob([JSON.stringify(resume, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${resume.basicInfo.name}-简历.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importResumeJson(file: File): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const resume = JSON.parse(reader.result as string) as Resume
        resolve(resume)
      } catch {
        reject(new Error('JSON 文件格式无效'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

function mergeLifePhotos(
  stored: LifePhoto[] | undefined,
  defaults: LifePhoto[],
): { photos: LifePhoto[]; changed: boolean } {
  if (!defaults.length) return { photos: stored ?? [], changed: false }
  if (!stored?.length) return { photos: defaults, changed: true }

  const known = new Set(stored.map((photo) => photo.src))
  const missing = defaults.filter((photo) => !known.has(photo.src))
  if (missing.length === 0) return { photos: stored, changed: false }

  return { photos: [...stored, ...missing], changed: true }
}

export function loadProfile(): PersonalProfile {
  const defaults = defaultProfile as PersonalProfile
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as PersonalProfile & {
        contentVersion?: number
      }
      const staleProfile =
        parsed.contentVersion !== PROFILE_CONTENT_VERSION || isStaleAbout(parsed.about)
      const mergedLifePhotos = mergeLifePhotos(parsed.lifePhotos, defaults.lifePhotos ?? [])
      const next: PersonalProfile & { contentVersion?: number } = {
        ...parsed,
        hobbies: parsed.hobbies ?? defaults.hobbies ?? [],
        lifeAbout: parsed.lifeAbout ?? defaults.lifeAbout ?? '',
        lifePhotos:
          staleProfile || !parsed.lifePhotos?.length
            ? (defaults.lifePhotos ?? [])
            : mergedLifePhotos.photos,
        tagline: staleProfile ? defaults.tagline : parsed.tagline,
        about: staleProfile ? defaults.about : parsed.about,
        highlights: staleProfile ? defaults.highlights : parsed.highlights,
        contentVersion: PROFILE_CONTENT_VERSION,
      }
      if (staleProfile || mergedLifePhotos.changed) {
        saveProfile(next)
      }
      return next
    }
  } catch (error) {
    console.error('读取个人介绍数据失败:', error)
  }
  return {
    ...defaults,
    contentVersion: PROFILE_CONTENT_VERSION,
  } as PersonalProfile
}

export function saveProfile(profile: PersonalProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile, null, 2))
}

export function resetProfile(): PersonalProfile {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
  return defaultProfile as PersonalProfile
}
