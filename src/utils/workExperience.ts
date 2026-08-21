import type { Resume, WorkExperience } from '../types/resume'

export function replaceWork(resume: Resume, work: WorkExperience): Resume {
  return {
    ...resume,
    workExperiences: resume.workExperiences.map((item) =>
      item.id === work.id ? work : item,
    ),
  }
}

export function updateWork(
  resume: Resume,
  workId: string,
  updater: (work: WorkExperience) => WorkExperience,
): Resume {
  const work = resume.workExperiences.find((item) => item.id === workId)
  if (!work) return resume
  return replaceWork(resume, updater(work))
}
