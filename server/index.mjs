import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { createManualJob, refreshJobs } from './services/jobFetcher.mjs'
import { createVariantRecord, optimizeResumeForJob } from './services/resumeOptimizer.mjs'
import { restartScheduler, runScheduledRefresh, startScheduler } from './services/scheduler.mjs'
import {
  generateCoverLetter,
  generateInterviewPrep,
  generateSelfIntro,
  parseJdText,
  STATUS_LABELS,
} from './services/applicationAssistant.mjs'
import {
  getLlmStatus,
  initLlmConfigIfMissing,
  polishCoverLetter,
  polishSelfIntro,
} from './services/llmService.mjs'
import {
  fetchBossJobs,
  getBossStatus,
  initBossConfigIfMissing,
} from './services/bossFetcher.mjs'
import {
  fetchLiepinJobs,
  getLiepinStatus,
  initLiepinConfigIfMissing,
} from './services/liepinFetcher.mjs'
import { enrichJob, enrichJobs } from './services/jobClassifier.mjs'
import { computeReminders } from './services/reminderService.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, 'config/job-monitor.json')
const JOBS_PATH = path.join(__dirname, 'data/jobs.json')
const VARIANTS_PATH = path.join(__dirname, 'data/variants.json')
const APPLICATIONS_PATH = path.join(__dirname, 'data/applications.json')
const RESUME_PATH = path.join(__dirname, '../src/data/resume.json')

const PORT = Number(process.env.CHENMO_API_PORT) || 3456

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function getJobById(jobId) {
  const store = await readJson(JOBS_PATH, { jobs: [] })
  return (store.jobs ?? []).find((j) => j.id === jobId) ?? null
}

async function getVariantByJobId(jobId) {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  return (store.variants ?? []).find((v) => v.jobId === jobId) ?? null
}

async function ensureApplication(jobId, job) {
  const store = await readJson(APPLICATIONS_PATH, { applications: [] })
  let app = (store.applications ?? []).find((a) => a.jobId === jobId)
  if (!app) {
    app = {
      id: crypto.randomUUID(),
      jobId,
      company: job?.company ?? '',
      jobTitle: job?.title ?? '',
      status: 'watching',
      priority: 'medium',
      profile: 'business-expert',
      notes: '',
      appliedAt: null,
      nextAction: '',
      nextActionDate: null,
      interviewNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    store.applications = [app, ...(store.applications ?? [])]
    await writeJson(APPLICATIONS_PATH, store)
  }
  return app
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'chenmo-job-assistant' })
})

app.get('/api/config', async (_req, res) => {
  const config = await readJson(CONFIG_PATH, {})
  res.json(config)
})

app.put('/api/config', async (req, res) => {
  const config = req.body
  await writeJson(CONFIG_PATH, config)
  await restartScheduler()
  res.json({ ok: true, config })
})

app.get('/api/jobs', async (_req, res) => {
  const store = await readJson(JOBS_PATH, { jobs: [] })
  res.json({ ...store, jobs: enrichJobs(store.jobs ?? []) })
})

app.patch('/api/jobs/:id', async (req, res) => {
  const store = await readJson(JOBS_PATH, { jobs: [] })
  const idx = (store.jobs ?? []).findIndex((j) => j.id === req.params.id)
  if (idx < 0) {
    res.status(404).json({ error: 'job not found' })
    return
  }

  const { isOutsourcing } = req.body ?? {}
  if (typeof isOutsourcing === 'boolean') {
    store.jobs[idx] = enrichJob(store.jobs[idx], {
      isOutsourcing,
      isOutsourcingManual: true,
      outsourcingReason: isOutsourcing ? '手动标注为外包' : '手动标注为正职',
    })
    await writeJson(JOBS_PATH, store)
    res.json({ job: store.jobs[idx] })
    return
  }

  res.status(400).json({ error: 'unsupported patch fields' })
})

app.post('/api/jobs/refresh', async (req, res) => {
  const includeBoss = req.body?.includeBoss !== false
  const includeLiepin = req.body?.includeLiepin !== false
  const result = await runScheduledRefresh({ includeBoss, includeLiepin, force: true })
  const store = await readJson(JOBS_PATH, { jobs: [] })
  res.json({ ...result, store: { ...store, jobs: enrichJobs(store.jobs ?? []) } })
})

app.post('/api/jobs/refresh-boss', async (_req, res) => {
  const config = await readJson(CONFIG_PATH, { keywords: [] })
  const bossResult = await fetchBossJobs(config.keywords ?? [])
  if (bossResult.error && !bossResult.jobs.length) {
    res.status(400).json({ error: bossResult.error, jobs: [] })
    return
  }

  const store = await readJson(JOBS_PATH, { jobs: [] })
  const byKey = new Map()
  for (const job of store.jobs ?? []) {
    byKey.set(`${job.companyId ?? job.company}:${job.title}`, job)
  }

  for (const job of bossResult.jobs) {
    const key = `${job.companyId ?? job.company}:${job.title}`
    const prev = byKey.get(key)
    const merged = enrichJob(
      prev
        ? {
            ...prev,
            ...job,
            id: prev.id,
            description:
              prev.description?.length > job.description?.length
                ? prev.description
                : job.description,
            isOutsourcingManual: prev.isOutsourcingManual,
          }
        : job,
    )
    byKey.set(key, merged)
    await ensureApplication(merged.id, merged)
  }

  const jobs = enrichJobs(
    [...byKey.values()].sort(
      (a, b) => new Date(b.fetchedAt ?? 0).getTime() - new Date(a.fetchedAt ?? 0).getTime(),
    ),
  )
  await writeJson(JOBS_PATH, {
    ...store,
    lastRefreshAt: new Date().toISOString(),
    jobs,
  })

  res.json({
    ok: true,
    fetched: bossResult.jobs.length,
    jobs,
    error: bossResult.error,
  })
})

app.post('/api/jobs/refresh-liepin', async (_req, res) => {
  const config = await readJson(CONFIG_PATH, { keywords: [] })
  const liepinResult = await fetchLiepinJobs(config.keywords ?? [])
  if (liepinResult.error && !liepinResult.jobs.length) {
    res.status(400).json({ error: liepinResult.error, jobs: [] })
    return
  }

  const store = await readJson(JOBS_PATH, { jobs: [] })
  const byKey = new Map()
  for (const job of store.jobs ?? []) {
    byKey.set(`${job.companyId ?? job.company}:${job.title}`, job)
  }

  for (const job of liepinResult.jobs) {
    const key = `${job.companyId ?? job.company}:${job.title}`
    const prev = byKey.get(key)
    const merged = enrichJob(
      prev
        ? {
            ...prev,
            ...job,
            id: prev.id,
            description:
              prev.description?.length > job.description?.length
                ? prev.description
                : job.description,
            isOutsourcingManual: prev.isOutsourcingManual,
          }
        : job,
    )
    byKey.set(key, merged)
    await ensureApplication(merged.id, merged)
  }

  const jobs = enrichJobs(
    [...byKey.values()].sort(
      (a, b) => new Date(b.fetchedAt ?? 0).getTime() - new Date(a.fetchedAt ?? 0).getTime(),
    ),
  )
  await writeJson(JOBS_PATH, {
    ...store,
    lastRefreshAt: new Date().toISOString(),
    jobs,
  })

  res.json({
    ok: true,
    fetched: liepinResult.jobs.length,
    jobs,
    error: liepinResult.error,
  })
})

app.post('/api/jobs/import', async (req, res) => {
  const job = createManualJob(req.body ?? {})
  const store = await readJson(JOBS_PATH, { jobs: [] })
  const jobs = [job, ...(store.jobs ?? [])]
  await writeJson(JOBS_PATH, { ...store, jobs })
  await ensureApplication(job.id, job)
  res.json({ ok: true, job })
})

app.post('/api/jobs/parse-jd', async (req, res) => {
  const { text } = req.body ?? {}
  const parsed = parseJdText(text ?? '')
  res.json({ parsed })
})

app.post('/api/jobs/quick-import', async (req, res) => {
  const { text } = req.body ?? {}
  const parsed = parseJdText(text ?? '')

  if (!parsed.title?.trim() && !parsed.description?.trim()) {
    res.status(400).json({ error: '无法识别岗位信息，请粘贴完整 JD（含岗位名称或职责描述）' })
    return
  }

  const channelLabel =
    parsed.channel === 'boss' ? 'Boss直聘' : parsed.channel === 'liepin' ? '猎聘' : '手动粘贴'
  const job = createManualJob({
    company: parsed.company,
    title: parsed.title?.trim() || '未命名岗位',
    description: parsed.description,
    requirements: parsed.requirements,
  })
  job.pasteChannel = parsed.channel ?? 'other'
  if (job.description && !job.description.includes(channelLabel)) {
    job.description = `【来源：${channelLabel}】\n${job.description}`
  }

  const store = await readJson(JOBS_PATH, { jobs: [] })
  const jobs = [job, ...(store.jobs ?? [])]
  await writeJson(JOBS_PATH, { ...store, jobs })
  await ensureApplication(job.id, job)

  res.json({ ok: true, job, parsed })
})

app.delete('/api/jobs/:id', async (req, res) => {
  const store = await readJson(JOBS_PATH, { jobs: [] })
  const jobs = (store.jobs ?? []).filter((j) => j.id !== req.params.id)
  await writeJson(JOBS_PATH, { ...store, jobs })
  res.json({ ok: true })
})

app.get('/api/variants', async (_req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  res.json(store)
})

app.get('/api/variants/:id', async (req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const variant = (store.variants ?? []).find((v) => v.id === req.params.id)
  if (!variant) {
    res.status(404).json({ error: 'variant not found' })
    return
  }
  res.json(variant)
})

app.post('/api/optimize', async (req, res) => {
  const { jobId, resume: clientResume, profile = 'business-expert' } = req.body ?? {}

  const job = await getJobById(jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }

  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  if (!baseResume) {
    res.status(400).json({ error: 'resume data missing' })
    return
  }

  const optimized = optimizeResumeForJob(baseResume, job, { profile })
  const variant = createVariantRecord(baseResume, job, optimized)

  const variantStore = await readJson(VARIANTS_PATH, { variants: [] })
  const variants = [
    variant,
    ...(variantStore.variants ?? []).filter((v) => v.jobId !== jobId),
  ]
  await writeJson(VARIANTS_PATH, { variants })

  const appStore = await readJson(APPLICATIONS_PATH, { applications: [] })
  const apps = (appStore.applications ?? []).map((a) =>
    a.jobId === jobId ? { ...a, profile, updatedAt: new Date().toISOString() } : a,
  )
  if (!apps.some((a) => a.jobId === jobId)) {
    apps.unshift(await ensureApplication(jobId, job))
  }
  await writeJson(APPLICATIONS_PATH, { applications: apps })

  res.json({ variant, optimized })
})

app.post('/api/optimize/preview', async (req, res) => {
  const {
    title,
    company,
    description,
    requirements,
    resume: clientResume,
    profile = 'business-expert',
  } = req.body ?? {}

  const job = createManualJob({
    title: title || '预览岗位',
    company: company || '预览公司',
    description: description || '',
    requirements: requirements || '',
  })

  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  if (!baseResume) {
    res.status(400).json({ error: 'resume data missing' })
    return
  }

  const optimized = optimizeResumeForJob(baseResume, job, { profile })
  res.json({ job, ...optimized })
})

app.get('/api/applications', async (_req, res) => {
  const [appStore, jobStore, variantStore] = await Promise.all([
    readJson(APPLICATIONS_PATH, { applications: [] }),
    readJson(JOBS_PATH, { jobs: [] }),
    readJson(VARIANTS_PATH, { variants: [] }),
  ])

  const existingJobIds = new Set((appStore.applications ?? []).map((a) => a.jobId))
  let applications = [...(appStore.applications ?? [])]
  let migrated = false

  for (const job of jobStore.jobs ?? []) {
    if (!existingJobIds.has(job.id)) {
      applications.push(await ensureApplication(job.id, job))
      migrated = true
    }
  }

  if (migrated) {
    await writeJson(APPLICATIONS_PATH, { applications })
  }

  const jobsById = new Map((jobStore.jobs ?? []).map((j) => [j.id, j]))
  const variantsByJob = new Map((variantStore.variants ?? []).map((v) => [v.jobId, v]))

  const enriched = applications.map((app) => ({
    ...app,
    statusLabel: STATUS_LABELS[app.status] ?? app.status,
    job: jobsById.get(app.jobId) ?? null,
    variant: variantsByJob.get(app.jobId) ?? null,
  }))

  res.json({ applications: enriched, statusLabels: STATUS_LABELS })
})

app.post('/api/applications', async (req, res) => {
  const { jobId } = req.body ?? {}
  const job = await getJobById(jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }
  const app = await ensureApplication(jobId, job)
  res.json({ application: app })
})

app.patch('/api/applications/:id', async (req, res) => {
  const store = await readJson(APPLICATIONS_PATH, { applications: [] })
  const idx = (store.applications ?? []).findIndex((a) => a.id === req.params.id)
  if (idx < 0) {
    res.status(404).json({ error: 'application not found' })
    return
  }

  const allowed = [
    'status',
    'priority',
    'profile',
    'notes',
    'appliedAt',
    'nextAction',
    'nextActionDate',
    'interviewNotes',
  ]
  const updates = {}
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) updates[key] = req.body[key]
  }

  store.applications[idx] = {
    ...store.applications[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await writeJson(APPLICATIONS_PATH, store)
  res.json({ application: store.applications[idx] })
})

app.post('/api/assist/cover-letter', async (req, res) => {
  const { jobId, profile = 'business-expert', resume: clientResume } = req.body ?? {}
  const job = await getJobById(jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }
  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  const variant = await getVariantByJobId(jobId)
  const meta = variant?.meta ?? optimizeResumeForJob(baseResume, job, { profile }).meta

  res.json({
    coverLetter: generateCoverLetter(job, baseResume, profile, meta),
    selfIntro: generateSelfIntro(job, baseResume, profile),
    profile,
  })
})

app.get('/api/llm/status', async (_req, res) => {
  res.json(await getLlmStatus())
})

app.post('/api/assist/polish', async (req, res) => {
  const {
    jobId,
    type = 'cover-letter',
    draft,
    profile = 'business-expert',
  } = req.body ?? {}

  const job = await getJobById(jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }
  if (!draft?.trim()) {
    res.status(400).json({ error: 'draft is required' })
    return
  }

  const llmStatus = await getLlmStatus()
  if (!llmStatus.enabled) {
    res.status(503).json({
      error: 'LLM 未配置，请编辑 server/config/llm.json 或设置 CHENMO_LLM_API_KEY',
      llmStatus,
    })
    return
  }

  try {
    const polished =
      type === 'self-intro'
        ? await polishSelfIntro(draft, job, profile)
        : await polishCoverLetter(draft, job, profile)

    if (!polished) {
      res.status(502).json({ error: 'LLM 返回为空' })
      return
    }

    res.json({ polished, type, profile })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: msg })
  }
})

app.get('/api/boss/status', async (_req, res) => {
  res.json(await getBossStatus())
})

app.get('/api/liepin/status', async (_req, res) => {
  res.json(await getLiepinStatus())
})

app.get('/api/reminders', async (_req, res) => {
  const store = await readJson(APPLICATIONS_PATH, { applications: [] })
  res.json(computeReminders(store.applications ?? []))
})

app.post('/api/applications/:id/interview-notes', async (req, res) => {
  const { round, content, date } = req.body ?? {}
  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  const store = await readJson(APPLICATIONS_PATH, { applications: [] })
  const idx = (store.applications ?? []).findIndex((a) => a.id === req.params.id)
  if (idx < 0) {
    res.status(404).json({ error: 'application not found' })
    return
  }

  const note = {
    id: crypto.randomUUID(),
    date: date || new Date().toISOString().slice(0, 10),
    round: round?.trim() || '面试',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  }

  const notes = [...(store.applications[idx].interviewNotes ?? []), note]
  store.applications[idx] = {
    ...store.applications[idx],
    interviewNotes: notes,
    updatedAt: new Date().toISOString(),
  }
  await writeJson(APPLICATIONS_PATH, store)
  res.json({ note, application: store.applications[idx] })
})

app.delete('/api/applications/:id/interview-notes/:noteId', async (req, res) => {
  const store = await readJson(APPLICATIONS_PATH, { applications: [] })
  const idx = (store.applications ?? []).findIndex((a) => a.id === req.params.id)
  if (idx < 0) {
    res.status(404).json({ error: 'application not found' })
    return
  }

  const notes = (store.applications[idx].interviewNotes ?? []).filter(
    (n) => n.id !== req.params.noteId,
  )
  store.applications[idx] = {
    ...store.applications[idx],
    interviewNotes: notes,
    updatedAt: new Date().toISOString(),
  }
  await writeJson(APPLICATIONS_PATH, store)
  res.json({ application: store.applications[idx] })
})

app.post('/api/assist/interview-prep', async (req, res) => {
  const { jobId, profile = 'business-expert', resume: clientResume } = req.body ?? {}
  const job = await getJobById(jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }
  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  const variant = await getVariantByJobId(jobId)
  const meta = variant?.meta ?? optimizeResumeForJob(baseResume, job, { profile }).meta

  res.json({ prep: generateInterviewPrep(job, baseResume, meta) })
})

app.get('/api/dashboard', async (_req, res) => {
  const [appStore, jobStore, variantStore] = await Promise.all([
    readJson(APPLICATIONS_PATH, { applications: [] }),
    readJson(JOBS_PATH, { jobs: [] }),
    readJson(VARIANTS_PATH, { variants: [] }),
  ])

  const apps = appStore.applications ?? []
  const byStatus = {}
  for (const [k, v] of Object.entries(STATUS_LABELS)) {
    byStatus[k] = apps.filter((a) => a.status === k).length
  }

  res.json({
    totalJobs: (jobStore.jobs ?? []).length,
    totalVariants: (variantStore.variants ?? []).length,
    totalApplications: apps.length,
    byStatus,
    statusLabels: STATUS_LABELS,
    avgMatchScore:
      (variantStore.variants ?? []).length
        ? Math.round(
            (variantStore.variants ?? []).reduce((s, v) => s + v.matchScore, 0) /
              variantStore.variants.length,
          )
        : 0,
  })
})

const SCREENSHOTS_DIR = path.join(__dirname, 'data/screenshots')
const PUBLIC_SITE_URL = process.env.CHENMO_PUBLIC_URL || ''

function isLocalRequest(req) {
  const ip = req.ip || req.socket?.remoteAddress || ''
  const host = (req.get('host') || '').toLowerCase()
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')
  )
}

function resolvePublicSiteUrl(req) {
  if (PUBLIC_SITE_URL) return PUBLIC_SITE_URL.replace(/\/$/, '')
  const host = req.get('host')
  if (!host || host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return ''
  }
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http'
  return `${proto}://${host}`.replace(/\/$/, '')
}

function resolveResumePublicUrl(req, variantId) {
  const base = resolvePublicSiteUrl(req)
  if (base) return `${base}/r/${variantId}`
  return `/r/${variantId}`
}

async function saveScreenshotBase64(base64, variantId) {
  if (!base64?.startsWith('data:image')) return null
  const match = base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) return null
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 3 * 1024 * 1024) {
    throw new Error('截图过大，请压缩后重试（最大 3MB）')
  }
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true })
  const filename = `${variantId}.${ext}`
  await fs.writeFile(path.join(SCREENSHOTS_DIR, filename), buffer)
  return `/api/uploads/screenshots/${filename}`
}

app.use('/api/uploads/screenshots', express.static(SCREENSHOTS_DIR))

app.get('/api/access-mode', (req, res) => {
  res.json({
    isLocal: isLocalRequest(req),
    publicSiteUrl: resolvePublicSiteUrl(req),
  })
})

app.get('/api/public/variants/:id', async (req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const variant = (store.variants ?? []).find((v) => v.id === req.params.id)
  if (!variant) {
    res.status(404).json({ error: '简历不存在' })
    return
  }
  res.json({
    id: variant.id,
    company: variant.company,
    jobTitle: variant.jobTitle,
    matchScore: variant.matchScore,
    resume: variant.resume,
    meta: variant.meta,
    createdAt: variant.createdAt,
    jdSummary: variant.jdSummary,
    screenshotUrl: variant.screenshotUrl,
    profileSiteUrl: variant.profileSiteUrl,
    publicUrl: variant.publicUrl,
  })
})

app.post('/api/resume-maker', async (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ error: '简历制作仅支持本机访问' })
    return
  }

  const {
    jdText = '',
    screenshotBase64,
    profile = 'business-expert',
    resume: clientResume,
  } = req.body ?? {}

  if (!jdText.trim()) {
    res.status(400).json({ error: '请填写或粘贴招聘 JD' })
    return
  }

  const parsed = parseJdText(jdText)
  const job = createManualJob({
    company: parsed.company,
    title: parsed.title?.trim() || '未命名岗位',
    description: parsed.description || jdText,
    requirements: parsed.requirements,
  })
  job.pasteChannel = parsed.channel ?? 'other'

  const jobStore = await readJson(JOBS_PATH, { jobs: [] })
  await writeJson(JOBS_PATH, { jobs: [job, ...(jobStore.jobs ?? [])] })
  await ensureApplication(job.id, job)

  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  if (!baseResume) {
    res.status(400).json({ error: '简历数据缺失' })
    return
  }

  const optimized = optimizeResumeForJob(baseResume, job, { profile })
  const variant = createVariantRecord(baseResume, job, optimized)

  const profileSiteUrl = resolvePublicSiteUrl(req)
  variant.publicUrl = resolveResumePublicUrl(req, variant.id)
  variant.profileSiteUrl = profileSiteUrl || undefined
  variant.jdSummary = jdText.trim().slice(0, 500)

  if (screenshotBase64) {
    try {
      variant.screenshotUrl = await saveScreenshotBase64(screenshotBase64, variant.id)
    } catch (err) {
      res.status(400).json({ error: err.message || '截图保存失败' })
      return
    }
  }

  if (profileSiteUrl && variant.resume?.summary) {
    variant.resume = {
      ...variant.resume,
      summary: `${variant.resume.summary}\n\n个人主页：${profileSiteUrl}`,
    }
  }

  const variantStore = await readJson(VARIANTS_PATH, { variants: [] })
  const variants = [
    variant,
    ...(variantStore.variants ?? []).filter((v) => v.jobId !== job.id),
  ]
  await writeJson(VARIANTS_PATH, { variants })

  res.json({ ok: true, variant, job })
})

app.listen(PORT, () => {
  console.log(`[chenmo-api] http://localhost:${PORT}`)
  Promise.all([
    initLlmConfigIfMissing(),
    initBossConfigIfMissing(),
    initLiepinConfigIfMissing(),
  ])
    .then(() => startScheduler())
    .catch((err) => {
      console.error('[chenmo-api] init/scheduler start failed:', err)
    })
})
