import {
  DEFAULT_RESUME_TEMPLATE_ID,
  isResumeTemplateId,
  type ResumeTemplateId,
} from '../templates'

const STORAGE_KEY = 'chenmo-resume-template'

export function loadResumeTemplateId(): ResumeTemplateId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isResumeTemplateId(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_RESUME_TEMPLATE_ID
}

export function saveResumeTemplateId(templateId: ResumeTemplateId): void {
  localStorage.setItem(STORAGE_KEY, templateId)
}
