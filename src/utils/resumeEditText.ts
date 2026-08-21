import type {
  BasicInfo,
  Education,
  ProjectExperience,
  Resume,
  SkillGroup,
  WorkExperience,
} from '../types/resume'
import { linesToList, listToLines, parseLabeledLines, serializeLabeledLines } from './sectionText'
import { getWorkDisplayCompany } from './workDisplay'

const BLOCK_SEP = '\n\n---\n\n'

export function serializeResumeBasicInfo(basicInfo: BasicInfo): string {
  const head = [basicInfo.name, basicInfo.title].join('\n')
  const labels = [
    { label: '电话', value: basicInfo.phone },
    { label: '邮箱', value: basicInfo.email },
    { label: '地点', value: basicInfo.location },
    { label: '学历', value: basicInfo.degree ?? '' },
    { label: '网站', value: basicInfo.website ?? '' },
    { label: '头像', value: basicInfo.avatarUrl ?? '' },
  ]
  return [head, serializeLabeledLines(labels)].join('\n\n')
}

export function parseResumeBasicInfo(text: string, prev: BasicInfo): BasicInfo {
  const parts = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  const headLines = parts[0]?.split('\n').map((line) => line.trim()) ?? []
  const labeled = parseLabeledLines(parts[1] ?? '')

  return {
    ...prev,
    name: headLines[0] ?? '',
    title: headLines[1] ?? '',
    phone: labeled['电话'] ?? prev.phone,
    email: labeled['邮箱'] ?? prev.email,
    location: labeled['地点'] ?? prev.location,
    degree: labeled['学历'] || undefined,
    website: labeled['网站'] || undefined,
    avatarUrl: labeled['头像'] || prev.avatarUrl,
  }
}

export function serializeResumeWorks(works: WorkExperience[]): string {
  return works
    .map((work) => {
      const header = `## ${work.id} | ${getWorkDisplayCompany(work)} | ${work.position} | ${work.startDate} | ${work.endDate}`
      const highlights = work.highlights.map((item) => `- ${item}`).join('\n')
      return [header, work.description, highlights].filter(Boolean).join('\n')
    })
    .join('\n\n')
}

export function parseResumeWorks(text: string, prev: WorkExperience[]): WorkExperience[] {
  const blocks = text
    .split(/\n(?=## )/)
    .map((block) => block.trim())
    .filter(Boolean)
  const prevById = new Map(prev.map((work) => [work.id, work]))

  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const headerParts =
      lines[0]?.replace(/^##\s*/, '').split('|').map((part) => part.trim()) ?? []
    const [id = '', company = '', position = '', startDate = '', endDate = ''] = headerParts
    const highlights: string[] = []
    const descriptionLines: string[] = []

    for (const line of lines.slice(1)) {
      if (line.startsWith('- ')) {
        highlights.push(line.slice(2).trim())
      } else {
        descriptionLines.push(line)
      }
    }

    const old = prevById.get(id) ?? prev[index]
    return {
      id: id || old?.id || `work-${index}`,
      company,
      position,
      startDate,
      endDate,
      description: descriptionLines.join('\n').trim(),
      highlights,
      featured: old?.featured,
      displayCompany: old?.displayCompany,
      detail: old?.detail,
    }
  })
}

export function serializeResumeProjects(projects: ProjectExperience[]): string {
  return projects
    .map((project) => {
      const header = `## ${project.id} | ${project.name} | ${project.role} | ${project.startDate} | ${project.endDate}`
      const tech =
        project.techStack.length > 0 ? `技术：${project.techStack.join('、')}` : ''
      const highlights = project.highlights.map((item) => `- ${item}`).join('\n')
      return [header, project.description, tech, highlights].filter(Boolean).join('\n')
    })
    .join('\n\n')
}

export function parseResumeProjects(
  text: string,
  prev: ProjectExperience[],
): ProjectExperience[] {
  const blocks = text
    .split(/\n(?=## )/)
    .map((block) => block.trim())
    .filter(Boolean)
  const prevById = new Map(prev.map((project) => [project.id, project]))

  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const headerParts =
      lines[0]?.replace(/^##\s*/, '').split('|').map((part) => part.trim()) ?? []
    const [id = '', name = '', role = '', startDate = '', endDate = ''] = headerParts
    const highlights: string[] = []
    const descriptionLines: string[] = []
    let techStack: string[] = []

    for (const line of lines.slice(1)) {
      if (line.startsWith('- ')) {
        highlights.push(line.slice(2).trim())
      } else if (line.startsWith('技术：') || line.startsWith('技术:')) {
        techStack = line
          .replace(/^技术[：:]/, '')
          .split(/[、,，]/)
          .map((item) => item.trim())
          .filter(Boolean)
      } else {
        descriptionLines.push(line)
      }
    }

    const old = prevById.get(id) ?? prev[index]
    return {
      id: id || old?.id || `project-${index}`,
      name,
      role,
      startDate,
      endDate,
      description: descriptionLines.join('\n').trim(),
      techStack: techStack.length > 0 ? techStack : (old?.techStack ?? []),
      highlights,
    }
  })
}

export function serializeResumeEducations(educations: Education[]): string {
  return educations
    .map((edu) => {
      const prefix = edu.deemphasized ? '* ' : ''
      return `${prefix}${edu.school} | ${edu.major} | ${edu.degree} | ${edu.startDate} | ${edu.endDate}`
    })
    .join('\n')
}

export function parseResumeEducations(text: string, prev: Education[]): Education[] {
  return linesToList(text).map((line, index) => {
    const deemphasized = line.startsWith('* ')
    const clean = deemphasized ? line.slice(2).trim() : line
    const parts = clean.split('|').map((part) => part.trim())
    const old = prev[index]
    return {
      id: old?.id ?? `edu-${index}`,
      school: parts[0] ?? '',
      major: parts[1] ?? '',
      degree: parts[2] ?? '',
      startDate: parts[3] ?? '',
      endDate: parts[4] ?? '',
      deemphasized,
    }
  })
}

/** 简历展示/导出用：过滤掉行首带 * 隐藏的学历 */
export function visibleEducations(educations: Education[]): Education[] {
  return educations.filter((edu) => !edu.deemphasized)
}

export function getPrimaryEducation(resume: Resume): Education | undefined {
  return visibleEducations(resume.educations)[0]
}

/** 学历区块展示：学校 · 专业 · 学历 */
export function formatEducationLine(
  edu: Pick<Education, 'school' | 'major' | 'degree'>,
): string {
  return [edu.school, edu.major, edu.degree]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ')
}

/** 页眉联系方式：学历与学历区块首条记录保持一致 */
export function getResumeContactItems(
  resume: Resume,
): { label: string; value: string }[] {
  const primaryEducation = getPrimaryEducation(resume)
  return [
    { label: '电话', value: resume.basicInfo.phone },
    { label: '邮箱', value: resume.basicInfo.email },
    { label: '地点', value: resume.basicInfo.location },
    {
      label: '学历',
      value: primaryEducation?.degree || resume.basicInfo.degree || '',
    },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))
}

export function mergeEducationsPatch(
  resume: Resume,
  educations: Education[],
): Pick<Resume, 'educations' | 'basicInfo'> {
  const primaryEducation = visibleEducations(educations)[0]
  const degree = primaryEducation?.degree?.trim()

  return {
    educations,
    basicInfo: degree
      ? { ...resume.basicInfo, degree }
      : resume.basicInfo,
  }
}

export function serializeResumeSkillGroups(groups: SkillGroup[]): string {
  return groups
    .map((group) => `${group.category}\n${group.items.join('、')}`)
    .join(BLOCK_SEP)
}

export function parseResumeSkillGroups(text: string, prev: SkillGroup[]): SkillGroup[] {
  const blocks = text
    .split(/\n\s*---\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const category = lines[0]?.trim() ?? ''
    const items = (lines[1] ?? '')
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
    return {
      id: prev[index]?.id ?? `skill-${index}`,
      category,
      items,
    }
  })
}

export function serializeVariantMeta(variant: {
  company: string
  jobTitle: string
  jdSummary?: string
}): string {
  const lines = [variant.company, variant.jobTitle]
  if (variant.jdSummary) {
    lines.push('', variant.jdSummary)
  }
  return lines.join('\n')
}

export function parseVariantMeta(text: string): {
  company: string
  jobTitle: string
  jdSummary?: string
} {
  const lines = text.split('\n')
  const company = lines[0]?.trim() ?? ''
  const jobTitle = lines[1]?.trim() ?? ''
  const jdSummary = lines.slice(2).join('\n').trim() || undefined
  return { company, jobTitle, jdSummary }
}

export { listToLines, linesToList }
