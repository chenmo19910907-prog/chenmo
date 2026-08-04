import type {
  BossStatus,
  DashboardStats,
  InterviewNote,
  InterviewPrep,
  JobApplication,
  JobMonitorConfig,
  JobStore,
  LlmStatus,
  ManualJobInput,
  ParsedJd,
  RemindersResponse,
  ResumeProfile,
  ResumeVariant,
  VariantStore,
} from '../types/job'
import type { Resume } from '../types/resume'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}

export function fetchConfig(): Promise<JobMonitorConfig> {
  return request('/config')
}

export function updateConfig(config: JobMonitorConfig): Promise<{ ok: boolean }> {
  return request('/config', { method: 'PUT', body: JSON.stringify(config) })
}

export function fetchJobs(): Promise<JobStore> {
  return request('/jobs')
}

export function refreshJobs(includeBoss = true): Promise<{
  store: JobStore
  fetched?: number
  bossFetched?: number
  errors?: string[]
}> {
  return request('/jobs/refresh', {
    method: 'POST',
    body: JSON.stringify({ includeBoss }),
  })
}

export function refreshBossJobs(): Promise<{ ok: boolean; fetched: number; error?: string }> {
  return request('/jobs/refresh-boss', { method: 'POST' })
}

export function fetchLlmStatus(): Promise<LlmStatus> {
  return request('/llm/status')
}

export function fetchBossStatus(): Promise<BossStatus> {
  return request('/boss/status')
}

export function fetchReminders(): Promise<RemindersResponse> {
  return request('/reminders')
}

export function polishAssist(
  jobId: string,
  draft: string,
  type: 'cover-letter' | 'self-intro',
  profile: ResumeProfile = 'business-expert',
): Promise<{ polished: string }> {
  return request('/assist/polish', {
    method: 'POST',
    body: JSON.stringify({ jobId, draft, type, profile }),
  })
}

export function addInterviewNote(
  applicationId: string,
  input: { round?: string; content: string; date?: string },
): Promise<{ note: InterviewNote; application: JobApplication }> {
  return request(`/applications/${applicationId}/interview-notes`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteInterviewNote(
  applicationId: string,
  noteId: string,
): Promise<{ application: JobApplication }> {
  return request(`/applications/${applicationId}/interview-notes/${noteId}`, {
    method: 'DELETE',
  })
}

export function importJob(input: ManualJobInput): Promise<{ job: JobStore['jobs'][0] }> {
  return request('/jobs/import', { method: 'POST', body: JSON.stringify(input) })
}

export function deleteJob(id: string): Promise<{ ok: boolean }> {
  return request(`/jobs/${id}`, { method: 'DELETE' })
}

export function updateJob(
  id: string,
  patch: { isOutsourcing?: boolean },
): Promise<{ job: JobStore['jobs'][0] }> {
  return request(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function fetchVariants(): Promise<VariantStore> {
  return request('/variants')
}

export function parseJd(text: string): Promise<{ parsed: ParsedJd }> {
  return request('/jobs/parse-jd', { method: 'POST', body: JSON.stringify({ text }) })
}

export function quickImportJd(text: string): Promise<{
  ok: boolean
  job: JobStore['jobs'][0]
  parsed: ParsedJd
}> {
  return request('/jobs/quick-import', { method: 'POST', body: JSON.stringify({ text }) })
}

export function fetchApplications(): Promise<{ applications: JobApplication[] }> {
  return request('/applications')
}

export function createApplication(jobId: string): Promise<{ application: JobApplication }> {
  return request('/applications', { method: 'POST', body: JSON.stringify({ jobId }) })
}

export function updateApplication(
  id: string,
  patch: Partial<JobApplication>,
): Promise<{ application: JobApplication }> {
  return request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function fetchDashboard(): Promise<DashboardStats> {
  return request('/dashboard')
}

export function optimizeForJob(
  jobId: string,
  resume: Resume,
  profile: ResumeProfile = 'business-expert',
): Promise<{ variant: ResumeVariant }> {
  return request('/optimize', {
    method: 'POST',
    body: JSON.stringify({ jobId, resume, profile }),
  })
}

export function previewOptimize(input: {
  title?: string
  company?: string
  description?: string
  requirements?: string
  resume: Resume
  profile?: ResumeProfile
}): Promise<{
  job: JobStore['jobs'][0]
  resume: Resume
  meta: ResumeVariant['meta']
}> {
  return request('/optimize/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function generateCoverLetter(
  jobId: string,
  resume: Resume,
  profile: ResumeProfile = 'business-expert',
): Promise<{ coverLetter: string; selfIntro: string; profile: ResumeProfile }> {
  return request('/assist/cover-letter', {
    method: 'POST',
    body: JSON.stringify({ jobId, resume, profile }),
  })
}

export function generateInterviewPrep(
  jobId: string,
  resume: Resume,
  profile: ResumeProfile = 'business-expert',
): Promise<{ prep: InterviewPrep }> {
  return request('/assist/interview-prep', {
    method: 'POST',
    body: JSON.stringify({ jobId, resume, profile }),
  })
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function formatRefreshTime(iso: string | null | undefined): string {
  if (!iso) return '尚未刷新'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '尚未刷新'
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function matchScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-rose-600 bg-rose-50 border-rose-200'
}
