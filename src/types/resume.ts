export interface BasicInfo {
  name: string
  title: string
  phone: string
  email: string
  location: string
  degree?: string
  website?: string
  github?: string
}

export interface WorkProject {
  name: string
  description: string
  highlights?: string[]
}

export interface WorkDetail {
  tagline: string
  businessOverview: string
  businessPoints: string[]
  responsibilities: string[]
  achievements: string[]
  tools: string[]
  projects: WorkProject[]
  teamInfo?: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
  featured?: boolean
  detail?: WorkDetail
}

export interface ProjectExperience {
  id: string
  name: string
  role: string
  startDate: string
  endDate: string
  description: string
  techStack: string[]
  highlights: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
  /** 弱化展示（如大专），不抢本科视觉重心 */
  deemphasized?: boolean
}

export interface SkillGroup {
  id: string
  category: string
  items: string[]
}

export interface Resume {
  basicInfo: BasicInfo
  summary: string
  workExperiences: WorkExperience[]
  projectExperiences: ProjectExperience[]
  educations: Education[]
  skillGroups: SkillGroup[]
  selfEvaluation?: string[]
}
