export interface BasicInfo {
  name: string
  title: string
  phone: string
  email: string
  location: string
  website?: string
  github?: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
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
}
