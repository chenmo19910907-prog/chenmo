import {
  DEFAULT_RESUME_TEMPLATE_ID,
  getDefaultTemplateForLayout,
  getTemplateLayout,
  isResumeTemplateId,
  isTemplateInLayout,
  resolveResumeTemplateId,
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

/** 合并服务端 variant 与本地模版选择，优先保留同版式下的配色变体 */
export function resolvePageTemplateId(
  variantTemplateId?: string,
  storedTemplateId: ResumeTemplateId = loadResumeTemplateId(),
): ResumeTemplateId {
  const stored = resolveResumeTemplateId(storedTemplateId)
  if (!variantTemplateId || !isResumeTemplateId(variantTemplateId)) {
    return stored
  }

  const resolved = resolveResumeTemplateId(variantTemplateId)
  const layout = getTemplateLayout(resolved)
  const layoutDefault = getDefaultTemplateForLayout(layout)

  if (
    resolved === layoutDefault &&
    isTemplateInLayout(stored, layout) &&
    stored !== resolved
  ) {
    return stored
  }

  return resolved
}

export function saveResumeTemplateId(templateId: ResumeTemplateId): void {
  localStorage.setItem(STORAGE_KEY, templateId)
}
