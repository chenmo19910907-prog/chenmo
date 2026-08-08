import type { PersonalProfile } from '../types/profile'
import type { Resume } from '../types/resume'
import defaultProfile from '../data/profile.json'
import defaultResume from '../data/resume.json'

const STORAGE_KEY = 'chenmo-resume'
const PROFILE_STORAGE_KEY = 'chenmo-profile'

export function loadResume(): Resume {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Resume
    }
  } catch (error) {
    console.error('读取本地简历数据失败:', error)
  }
  return defaultResume as Resume
}

export function saveResume(resume: Resume): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resume, null, 2))
}

export function resetResume(): Resume {
  localStorage.removeItem(STORAGE_KEY)
  return defaultResume as Resume
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

export function loadProfile(): PersonalProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as PersonalProfile
    }
  } catch (error) {
    console.error('读取个人介绍数据失败:', error)
  }
  return defaultProfile as PersonalProfile
}

export function saveProfile(profile: PersonalProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile, null, 2))
}

export function resetProfile(): PersonalProfile {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
  return defaultProfile as PersonalProfile
}
