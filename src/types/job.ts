export interface JobMonitorConfig {
  refreshIntervalHours: number
  enabled: boolean
  keywords: string[]
  channels?: Record<string, { enabled: boolean; label: string }>
  companies: TargetCompany[]
}

export interface TargetCompany {
  id: string
  name: string
  enabled: boolean
  sources: CompanySource[]
}

export interface CompanySource {
  type: 'career_page'
  url: string
  keywords?: string[]
}

export interface JobPosting {
  id: string
  company: string
  companyId?: string
  title: string
  url?: string
  description: string
  requirements?: string
  extractedKeywords?: string[]
  source: 'manual' | 'career_page' | 'boss' | 'liepin'
  fetchedAt: string
  status: 'active' | 'archived'
  /** 是否可能为外包岗位 */
  isOutsourcing?: boolean
  outsourcingConfidence?: 'likely' | 'possible' | 'direct'
  outsourcingReason?: string
  isOutsourcingManual?: boolean
  /** 粘贴导入时的来源渠道 */
  pasteChannel?: 'boss' | 'liepin' | 'other'
}

export interface JobStore {
  lastRefreshAt: string | null
  lastRefreshStatus?: string
  lastRefreshFetched?: number
  lastRefreshBossFetched?: number
  lastRefreshLiepinFetched?: number
  lastRefreshErrors?: string[]
  jobs: JobPosting[]
}

export interface OptimizeMeta {
  jobId: string
  jobTitle: string
  company: string
  profile?: ResumeProfile
  profileLabel?: string
  matchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  extractedKeywords: string[]
  suggestions: string[]
  optimizedAt: string
}

export type ResumeProfile = 'business-expert' | 'platform' | 'management'

export type ApplicationStatus =
  | 'watching'
  | 'todo'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'

export interface InterviewNote {
  id: string
  date: string
  round: string
  content: string
  createdAt: string
}

export interface JobApplication {
  id: string
  jobId: string
  company: string
  jobTitle: string
  status: ApplicationStatus
  statusLabel?: string
  priority: 'high' | 'medium' | 'low'
  profile: ResumeProfile
  notes: string
  appliedAt: string | null
  nextAction: string
  nextActionDate: string | null
  interviewNotes?: InterviewNote[]
  createdAt: string
  updatedAt: string
  job?: JobPosting | null
  variant?: ResumeVariant | null
}

export interface ParsedJd {
  company: string
  title: string
  description: string
  requirements: string
  salary?: string
  location?: string
  channel?: 'boss' | 'liepin' | 'other'
}

export interface InterviewQuestion {
  question: string
  hints: string[]
}

export interface InterviewPrep {
  jobTitle: string
  company: string
  matchScore: number
  questions: InterviewQuestion[]
  generalTips: string[]
}

export interface DashboardStats {
  totalJobs: number
  totalVariants: number
  totalApplications: number
  byStatus: Record<string, number>
  statusLabels: Record<string, string>
  avgMatchScore: number
}

export interface ReminderItem {
  applicationId: string
  jobId: string
  company: string
  jobTitle: string
  status: ApplicationStatus
  nextAction: string
  nextActionDate: string
  daysUntil: number
}

export interface RemindersResponse {
  overdue: ReminderItem[]
  upcoming: ReminderItem[]
  total: number
}

export interface LlmStatus {
  enabled: boolean
  model: string
  baseUrl: string
  configPath: string
}

export interface BossStatus {
  enabled: boolean
  playwrightAvailable: boolean
  queries: string[]
  configPath: string
}

export const PROFILE_OPTIONS: { value: ResumeProfile; label: string }[] = [
  { value: 'business-expert', label: '业务专家' },
  { value: 'platform', label: '平台 / 测开' },
  { value: 'management', label: '管理 / 组长' },
]

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'watching', label: '观望', color: 'bg-slate-100 text-slate-600' },
  { value: 'todo', label: '待投递', color: 'bg-amber-50 text-amber-700' },
  { value: 'applied', label: '已投递', color: 'bg-blue-50 text-blue-700' },
  { value: 'interview', label: '面试中', color: 'bg-violet-50 text-violet-700' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'rejected', label: '已拒绝', color: 'bg-rose-50 text-rose-700' },
  { value: 'archived', label: '已归档', color: 'bg-slate-50 text-slate-400' },
]

export interface JobAnalysisSearchLink {
  label: string
  url: string
}

export interface JobAnalysis {
  company: string
  title: string
  matchScore: number
  matchTier: 'high' | 'medium' | 'low' | 'unknown'
  profile?: ResumeProfile
  profileLabel?: string
  isOutsourcing: boolean
  outsourcingConfidence?: 'likely' | 'possible' | 'direct'
  outsourcingReason?: string
  companyBrief?: string
  companyBackground?: string[]
  industryGuess?: string
  employmentAdvice?: string
  suggestions: string[]
  searchLinks: JobAnalysisSearchLink[]
  analyzedAt: string
  extractionSource?: 'jd' | 'screenshot' | 'mixed'
}

export interface ResumeVariant {
  id: string
  jobId: string
  jobTitle: string
  company: string
  matchScore: number
  resume: import('./resume').Resume
  meta: OptimizeMeta
  createdAt: string
  /** 招聘 JD 摘要（简历制作） */
  jdSummary?: string
  /** 招聘信息截图 URL（首张，兼容旧数据） */
  screenshotUrl?: string
  /** 招聘信息截图 URL 列表 */
  screenshotUrls?: string[]
  /** 该份简历的公开访问地址 */
  publicUrl?: string
  /** 个人主页外网地址（附在简历中） */
  profileSiteUrl?: string
  /** 公司与岗位自动分析结果 */
  jobAnalysis?: JobAnalysis
}

export interface VariantStore {
  variants: ResumeVariant[]
}

export interface ManualJobInput {
  company?: string
  companyId?: string
  title: string
  url?: string
  description?: string
  requirements?: string
}
