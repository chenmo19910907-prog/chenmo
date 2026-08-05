import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cron from 'node-cron'
import { refreshJobs } from './jobFetcher.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, '../config/job-monitor.json')
const JOBS_PATH = path.join(__dirname, '../data/jobs.json')

let cronTask = null
let isRefreshing = false

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

/**
 * 执行一次岗位刷新
 * @returns {Promise<object>}
 */
export async function runScheduledRefresh(options = {}) {
  if (isRefreshing) {
    return { skipped: true, reason: 'refresh already in progress' }
  }

  isRefreshing = true
  try {
    const config = await readJson(CONFIG_PATH, { enabled: false, companies: [] })
    if (!config.enabled && options.force !== true) {
      return { skipped: true, reason: 'monitor disabled' }
    }

    const store = await readJson(JOBS_PATH, { jobs: [] })
    const result = await refreshJobs(config, store.jobs ?? [], {
      includeBoss: options.includeBoss !== false,
      includeLiepin: options.includeLiepin !== false,
    })

    await writeJson(JOBS_PATH, {
      lastRefreshAt: new Date().toISOString(),
      lastRefreshStatus: result.errors.length ? 'partial' : 'ok',
      lastRefreshFetched: result.fetched,
      lastRefreshBossFetched: result.bossFetched ?? 0,
      lastRefreshLiepinFetched: result.liepinFetched ?? 0,
      lastRefreshErrors: result.errors,
      jobs: result.jobs,
    })

    console.log(
      `[scheduler] 刷新完成：新增/更新 ${result.fetched} 条（Boss ${result.bossFetched ?? 0}，猎聘 ${result.liepinFetched ?? 0}），合计 ${result.jobs.length} 条`,
    )

    return {
      skipped: false,
      fetched: result.fetched,
      bossFetched: result.bossFetched ?? 0,
      liepinFetched: result.liepinFetched ?? 0,
      total: result.jobs.length,
      errors: result.errors,
    }
  } finally {
    isRefreshing = false
  }
}

/**
 * 根据配置启动定时任务
 */
export async function startScheduler() {
  stopScheduler()

  const config = await readJson(CONFIG_PATH, { enabled: false, refreshIntervalHours: 12 })
  if (!config.enabled) {
    console.log('[scheduler] 监控未启用，跳过定时任务')
    return
  }

  const hours = Math.max(1, Math.min(168, config.refreshIntervalHours ?? 12))
  const cronExpr = `0 */${hours} * * *`

  cronTask = cron.schedule(cronExpr, () => {
    runScheduledRefresh().catch((err) => {
      console.error('[scheduler] 定时刷新失败:', err)
    })
  })

  console.log(`[scheduler] 已启动，每 ${hours} 小时刷新一次 (${cronExpr})`)

  const store = await readJson(JOBS_PATH, { jobs: [] })
  if (!store.lastRefreshAt) {
    runScheduledRefresh().catch((err) => {
      console.error('[scheduler] 首次刷新失败:', err)
    })
  }
}

export function stopScheduler() {
  if (cronTask) {
    cronTask.stop()
    cronTask = null
  }
}

export function restartScheduler() {
  return startScheduler()
}
