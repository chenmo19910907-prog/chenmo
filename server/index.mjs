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
import { extractJobInfoFromScreenshots } from './services/screenshotExtractor.mjs'
import { buildJobAnalysis, enrichJobAnalysis, mergeParsedJobInfo } from './services/jobAnalysis.mjs'
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
import { detectResumeProfile } from './services/profileDetector.mjs'
import { computeReminders } from './services/reminderService.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, 'config/job-monitor.json')
const JOBS_PATH = path.join(__dirname, 'data/jobs.json')
const VARIANTS_PATH = path.join(__dirname, 'data/variants.json')
const APPLICATIONS_PATH = path.join(__dirname, 'data/applications.json')
const RESUME_PATH = path.join(__dirname, '../src/data/resume.json')

const PORT = Number(process.env.CHENMO_API_PORT) || 3456
const DIST_PATH = path.join(__dirname, '../dist')
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

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
app.set('trust proxy', true)
app.use(cors())
app.use(express.json({ limit: '50mb' }))

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
  res.json({
    ...store,
    variants: (store.variants ?? []).map((variant) => ({
      ...variant,
      jobAnalysis: enrichJobAnalysis(variant.jobAnalysis),
    })),
  })
})

app.get('/api/variants/:id', async (req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const variant = (store.variants ?? []).find((v) => v.id === req.params.id)
  if (!variant) {
    res.status(404).json({ error: 'variant not found' })
    return
  }
  res.json({
    ...variant,
    jobAnalysis: enrichJobAnalysis(variant.jobAnalysis),
  })
})

async function deleteVariantScreenshot(variantId) {
  try {
    const files = await fs.readdir(SCREENSHOTS_DIR)
    await Promise.all(
      files
        .filter(
          (filename) =>
            filename.startsWith(`${variantId}.`) || filename.startsWith(`${variantId}-`),
        )
        .map((filename) => fs.unlink(path.join(SCREENSHOTS_DIR, filename))),
    )
  } catch {
    /* 截图目录不存在或已删除时忽略 */
  }
}

app.get('/api/resume', async (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ error: '仅支持本机访问' })
    return
  }

  const resume = await readJson(RESUME_PATH, null)
  if (!resume) {
    res.status(404).json({ error: 'resume not found' })
    return
  }

  res.json(withPublicWebsite(resume, req))
})

app.patch('/api/variants/:id', async (req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const index = (store.variants ?? []).findIndex((v) => v.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'variant not found' })
    return
  }

  const { resume, company, jobTitle, jdSummary } = req.body ?? {}
  const current = store.variants[index]
  store.variants[index] = {
    ...current,
    ...(resume !== undefined && { resume }),
    ...(company !== undefined && { company }),
    ...(jobTitle !== undefined && { jobTitle }),
    ...(jdSummary !== undefined && { jdSummary }),
  }

  await writeJson(VARIANTS_PATH, store)
  res.json(store.variants[index])
})

app.post('/api/variants/:id/refresh', async (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ error: '仅支持本机访问' })
    return
  }

  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const index = (store.variants ?? []).findIndex((v) => v.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'variant not found' })
    return
  }

  const current = store.variants[index]
  const job = await getJobById(current.jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }

  const { resume: clientResume, profile = current.meta?.profile ?? 'business-expert' } = req.body ?? {}
  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  if (!baseResume) {
    res.status(400).json({ error: 'resume data missing' })
    return
  }

  const optimized = optimizeResumeForJob(baseResume, job, { profile })
  const jobAnalysis = buildJobAnalysis(job, optimized.meta, {
    profileLabel: optimized.meta.profileLabel,
    extractionSource: current.jobAnalysis?.extractionSource ?? 'jd',
  })
  store.variants[index] = {
    ...current,
    resume: withPublicWebsite(optimized.resume, req),
    meta: optimized.meta,
    matchScore: optimized.meta.matchScore,
    jobTitle: job.title,
    company: job.company,
    jobAnalysis,
  }

  await writeJson(VARIANTS_PATH, store)
  res.json(store.variants[index])
})

app.post('/api/variants/:id/analyze', async (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ error: '仅支持本机访问' })
    return
  }

  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const index = (store.variants ?? []).findIndex((v) => v.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'variant not found' })
    return
  }

  const current = store.variants[index]
  let job = await getJobById(current.jobId)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
    return
  }

  let extractionSource = current.jobAnalysis?.extractionSource ?? 'jd'
  const screenshotImages = await readAllScreenshotsAsBase64(current.id)
  const needsExtract =
    !job.company ||
    job.company === '未命名公司' ||
    !job.title ||
    job.title === '未命名岗位' ||
    !job.description?.trim() ||
    !job.requirements?.trim()

  if (screenshotImages.length > 0 && needsExtract) {
    try {
      const extracted = await extractJobInfoFromScreenshots(screenshotImages)
      if (extracted) {
        const merged = mergeParsedJobInfo(
          {
            company: job.company,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
          },
          extracted,
        )
        job = enrichJob({
          ...job,
          company: merged.company || job.company,
          title: merged.title || job.title,
          description: merged.description || job.description,
          requirements: merged.requirements || job.requirements,
        })
        extractionSource = current.jdSummary ? 'mixed' : 'screenshot'

        const jobStore = await readJson(JOBS_PATH, { jobs: [] })
        const jobs = jobStore.jobs ?? []
        const jobIndex = jobs.findIndex((item) => item.id === job.id)
        if (jobIndex >= 0) {
          jobs[jobIndex] = job
          await writeJson(JOBS_PATH, { jobs })
        }
      }
    } catch (err) {
      console.error('[analyze] screenshot extract failed:', err.message)
    }
  }

  const profile = current.meta?.profile ?? 'business-expert'
  const optimized = optimizeResumeForJob(current.resume, job, { profile })
  const jobAnalysis = buildJobAnalysis(job, optimized.meta, {
    profileLabel: optimized.meta.profileLabel,
    extractionSource,
  })

  store.variants[index] = {
    ...current,
    company: job.company,
    jobTitle: job.title,
    matchScore: optimized.meta.matchScore,
    meta: optimized.meta,
    resume: optimized.resume,
    jobAnalysis,
    jdSummary:
      [job.description, job.requirements].filter(Boolean).join('\n').slice(0, 500) ||
      current.jdSummary ||
      undefined,
  }

  await writeJson(VARIANTS_PATH, store)
  res.json(store.variants[index])
})

app.delete('/api/variants/:id', async (req, res) => {
  const store = await readJson(VARIANTS_PATH, { variants: [] })
  const variants = (store.variants ?? []).filter((v) => v.id !== req.params.id)
  if (variants.length === (store.variants ?? []).length) {
    res.status(404).json({ error: 'variant not found' })
    return
  }

  await writeJson(VARIANTS_PATH, { variants })
  await deleteVariantScreenshot(req.params.id)
  res.json({ ok: true })
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
  variant.resume = withPublicWebsite(variant.resume, req)

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
  const host = (req.get('host') || '').toLowerCase().split(':')[0]
  const ip = req.ip || req.socket?.remoteAddress || ''

  // 经 Cloudflare Tunnel 等反代时，外网请求 IP 可能仍是 127.0.0.1，以 Host 为准
  if (
    host &&
    !host.startsWith('localhost') &&
    !host.startsWith('127.0.0.1') &&
    host !== '[::1]'
  ) {
    return false
  }

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

function shouldSyncWebsite(website, publicSiteUrl) {
  const canonical = (publicSiteUrl || '').trim().replace(/\/+$/, '')
  if (!canonical) return false

  const current = website?.trim()
  if (!current) return true
  if (current.replace(/\/+$/, '') === canonical) return false

  return /natapp|cpolar|ngrok|trycloudflare|localhost|127\.0\.0\.1|your-domain\.com/i.test(current)
}

function withPublicWebsite(resume, req) {
  const url = resolvePublicSiteUrl(req)
  if (!url || !resume) return resume
  const current = resume.basicInfo?.website?.trim()
  const website = shouldSyncWebsite(current, url) ? url : current || url
  return {
    ...resume,
    basicInfo: {
      ...resume.basicInfo,
      website,
    },
  }
}

function resolveResumePublicUrl(req, variantId) {
  const base = resolvePublicSiteUrl(req)
  if (base) return `${base}/r/${variantId}`
  return `/r/${variantId}`
}

async function saveScreenshotBase64(base64, variantId, index = 0) {
  if (!base64?.startsWith('data:image')) return null
  const match = base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) return null
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 3 * 1024 * 1024) {
    throw new Error('截图过大，请压缩后重试（最大 3MB）')
  }
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true })
  const filename = `${variantId}-${index}.${ext}`
  await fs.writeFile(path.join(SCREENSHOTS_DIR, filename), buffer)
  return `/api/uploads/screenshots/${filename}`
}

async function saveScreenshotsBase64(base64List, variantId) {
  const urls = []
  for (let index = 0; index < base64List.length; index += 1) {
    const url = await saveScreenshotBase64(base64List[index], variantId, index)
    if (url) urls.push(url)
  }
  return urls
}

async function readScreenshotAsBase64(variantId, index = 0) {
  const files = await fs.readdir(SCREENSHOTS_DIR).catch(() => [])
  const prefix = `${variantId}-${index}.`
  const filename = files.find((name) => name.startsWith(prefix))
  if (!filename) return null
  const buffer = await fs.readFile(path.join(SCREENSHOTS_DIR, filename))
  const ext = filename.split('.').pop()?.toLowerCase()
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

async function readAllScreenshotsAsBase64(variantId) {
  const images = []
  for (let index = 0; index < 9; index += 1) {
    const base64 = await readScreenshotAsBase64(variantId, index)
    if (!base64) break
    images.push(base64)
  }
  return images
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
    screenshotUrls: variant.screenshotUrls,
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
    screenshotsBase64,
    resume: clientResume,
  } = req.body ?? {}

  const screenshotInputs = Array.isArray(screenshotsBase64)
    ? screenshotsBase64
    : screenshotBase64
      ? [screenshotBase64]
      : []

  if (!jdText.trim() && screenshotInputs.length === 0) {
    res.status(400).json({ error: '请至少上传一张招聘截图或粘贴 JD' })
    return
  }

  let parsed = parseJdText(jdText)
  let extractionSource = 'jd'

  if (screenshotInputs.length > 0) {
    try {
      const extracted = await extractJobInfoFromScreenshots(screenshotInputs)
      if (extracted) {
        parsed = mergeParsedJobInfo(parsed, extracted)
        extractionSource = jdText.trim() ? 'mixed' : 'screenshot'
      }
    } catch (err) {
      console.error('[resume-maker] screenshot extract failed:', err.message)
    }
  }

  const profileSource = [
    parsed.title,
    parsed.company,
    parsed.description,
    parsed.requirements,
    jdText,
  ]
    .filter(Boolean)
    .join('\n')
  const { profile, label: profileLabel } = detectResumeProfile(profileSource)

  const job = createManualJob({
    company: parsed.company,
    title: parsed.title?.trim() || '未命名岗位',
    description: parsed.description || jdText,
    requirements: parsed.requirements,
  })
  job.pasteChannel = parsed.channel ?? (screenshotInputs.length > 0 ? 'boss' : 'other')

  const jobStore = await readJson(JOBS_PATH, { jobs: [] })
  await writeJson(JOBS_PATH, { jobs: [job, ...(jobStore.jobs ?? [])] })
  const application = await ensureApplication(job.id, job)
  if (application.company !== job.company || application.jobTitle !== job.title) {
    const appStore = await readJson(APPLICATIONS_PATH, { applications: [] })
    const apps = appStore.applications ?? []
    const appIndex = apps.findIndex((item) => item.jobId === job.id)
    if (appIndex >= 0) {
      apps[appIndex] = {
        ...apps[appIndex],
        company: job.company,
        jobTitle: job.title,
        updatedAt: new Date().toISOString(),
      }
      await writeJson(APPLICATIONS_PATH, { applications: apps })
    }
  }

  const baseResume = clientResume ?? (await readJson(RESUME_PATH, null))
  if (!baseResume) {
    res.status(400).json({ error: '简历数据缺失' })
    return
  }

  const optimized = optimizeResumeForJob(baseResume, job, { profile })
  const variant = createVariantRecord(baseResume, job, optimized)
  variant.jobAnalysis = buildJobAnalysis(job, optimized.meta, {
    profileLabel,
    extractionSource,
  })

  const profileSiteUrl = resolvePublicSiteUrl(req)
  variant.publicUrl = resolveResumePublicUrl(req, variant.id)
  variant.profileSiteUrl = profileSiteUrl || undefined
  variant.jdSummary = jdText.trim()
    ? jdText.trim().slice(0, 500)
    : [parsed.description, parsed.requirements].filter(Boolean).join('\n').slice(0, 500) || undefined

  if (screenshotInputs.length > 0) {
    try {
      const urls = await saveScreenshotsBase64(screenshotInputs, variant.id)
      variant.screenshotUrls = urls
      variant.screenshotUrl = urls[0]
    } catch (err) {
      res.status(400).json({ error: err.message || '截图保存失败' })
      return
    }
  }

  if (profileSiteUrl && variant.resume) {
    variant.resume = withPublicWebsite(variant.resume, req)
  } else if (variant.resume) {
    variant.resume = withPublicWebsite(variant.resume, req)
  }

  const variantStore = await readJson(VARIANTS_PATH, { variants: [] })
  const variants = [
    variant,
    ...(variantStore.variants ?? []).filter((v) => v.jobId !== job.id),
  ]
  await writeJson(VARIANTS_PATH, { variants })

  res.json({ ok: true, variant, job, profile, profileLabel })
})

app.post('/api/detect-profile', async (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ error: '仅支持本机访问' })
    return
  }

  const { jdText = '' } = req.body ?? {}
  const parsed = parseJdText(jdText)
  const combined = [
    parsed.title,
    parsed.company,
    parsed.description,
    parsed.requirements,
    jdText,
  ]
    .filter(Boolean)
    .join('\n')

  res.json(detectResumeProfile(combined))
})

async function startServer() {
  if (IS_PRODUCTION) {
    try {
      await fs.access(DIST_PATH)
      app.use(
        express.static(DIST_PATH, {
          setHeaders(res, filePath) {
            if (path.basename(filePath) === 'index.html') {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            }
          },
        }),
      )
      app.get(/^(?!\/api).*/, (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.sendFile(path.join(DIST_PATH, 'index.html'))
      })
      console.log(`[chenmo] serving static files from ${DIST_PATH}`)
    } catch {
      console.warn(`[chenmo] dist not found at ${DIST_PATH}, run npm run build first`)
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    const publicUrl = PUBLIC_SITE_URL || '(set CHENMO_PUBLIC_URL for share links)'
    console.log(`[chenmo] http://localhost:${PORT}`)
    if (IS_PRODUCTION) {
      console.log(`[chenmo] public url: ${publicUrl}`)
    }
    Promise.all([
      initLlmConfigIfMissing(),
      initBossConfigIfMissing(),
      initLiepinConfigIfMissing(),
    ])
      .then(() => startScheduler())
      .catch((err) => {
        console.error('[chenmo] init/scheduler start failed:', err)
      })
  })
}

startServer().catch((err) => {
  console.error('[chenmo] failed to start:', err)
  process.exit(1)
})
