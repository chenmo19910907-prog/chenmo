import crypto from 'node:crypto'
import * as cheerio from 'cheerio'
import { extractKeywords } from './keywordExtract.mjs'
import { fetchBossJobs } from './bossFetcher.mjs'
import { fetchLiepinJobs } from './liepinFetcher.mjs'
import { enrichJob, enrichJobs } from './jobClassifier.mjs'

/**
 * 从招聘页 HTML 中提取可能的岗位条目（启发式，不保证各站点 100% 准确）
 * @param {string} html
 * @param {string} pageUrl
 * @param {object} company
 * @param {string[]} filterKeywords
 * @returns {object[]}
 */
function parseJobsFromHtml(html, pageUrl, company, filterKeywords) {
  const $ = cheerio.load(html)
  const jobs = []
  const seen = new Set()

  $('a').each((_, el) => {
    const $el = $(el)
    const title = $el.text().replace(/\s+/g, ' ').trim()
    const href = $el.attr('href')

    if (!title || title.length < 4 || title.length > 80) return
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

    const lower = title.toLowerCase()
    const hitGlobal = filterKeywords.some((kw) => lower.includes(kw.toLowerCase()))
    const hitTitle = /测试|qa|质量|quality|test/i.test(title)
    if (!hitGlobal && !hitTitle) return

    const url = href.startsWith('http') ? href : new URL(href, pageUrl).href
    const key = `${company.id}:${title}`
    if (seen.has(key)) return
    seen.add(key)

    jobs.push({
      id: crypto.randomUUID(),
      company: company.name,
      companyId: company.id,
      title,
      url,
      description: `来自 ${company.name} 招聘页：${title}`,
      requirements: '',
      source: 'career_page',
      fetchedAt: new Date().toISOString(),
      status: 'active',
    })
  })

  return jobs.slice(0, 20)
}

/**
 * 抓取单个公司招聘源
 * @param {object} company
 * @param {string[]} globalKeywords
 * @returns {Promise<object[]>}
 */
async function fetchCompanyJobs(company, globalKeywords) {
  const results = []

  for (const source of company.sources ?? []) {
    if (source.type !== 'career_page' || !source.url) continue

    const keywords = [...globalKeywords, ...(source.keywords ?? [])]

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
      clearTimeout(timeout)

      if (!res.ok) {
        console.warn(`[jobFetcher] ${company.name} HTTP ${res.status}: ${source.url}`)
        continue
      }

      const html = await res.text()
      const parsed = parseJobsFromHtml(html, source.url, company, keywords)
      results.push(...parsed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[jobFetcher] ${company.name} 抓取失败: ${msg}`)
    }
  }

  return results
}

/**
 * 刷新全部监控公司的岗位
 * @param {object} config
 * @param {object[]} existingJobs
 * @returns {Promise<{ jobs: object[], fetched: number, errors: string[] }>}
 */
export async function refreshJobs(config, existingJobs = [], options = {}) {
  const enabledCompanies = (config.companies ?? []).filter((c) => c.enabled !== false)
  const globalKeywords = config.keywords ?? []
  const fetched = []
  const errors = []
  let bossFetched = 0
  let liepinFetched = 0
  const channels = config.channels ?? {}

  for (const company of enabledCompanies) {
    try {
      const companyJobs = await fetchCompanyJobs(company, globalKeywords)
      fetched.push(...companyJobs)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${company.name}: ${msg}`)
    }
  }

  if (options.includeBoss !== false && channels.boss?.enabled !== false) {
    try {
      const bossResult = await fetchBossJobs(globalKeywords)
      if (bossResult.error) {
        errors.push(`Boss直聘: ${bossResult.error}`)
      } else {
        fetched.push(...bossResult.jobs)
        bossFetched = bossResult.jobs.length
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Boss直聘: ${msg}`)
    }
  }

  if (options.includeLiepin !== false && channels.liepin?.enabled !== false) {
    try {
      const liepinResult = await fetchLiepinJobs(globalKeywords)
      if (liepinResult.error) {
        errors.push(`猎聘: ${liepinResult.error}`)
      } else {
        fetched.push(...liepinResult.jobs)
        liepinFetched = liepinResult.jobs.length
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`猎聘: ${msg}`)
    }
  }

  const manualJobs = existingJobs.filter((j) => j.source === 'manual')
  const merged = enrichJobs(mergeJobs([...manualJobs, ...fetched], existingJobs))

  return {
    jobs: merged,
    fetched: fetched.length,
    bossFetched,
    liepinFetched,
    errors,
  }
}

/**
 * 合并新旧岗位，保留 manual 与已有详情
 * @param {object[]} incoming
 * @param {object[]} existing
 */
function mergeJobs(incoming, existing) {
  const byKey = new Map()

  for (const job of existing) {
    const key = `${job.companyId ?? job.company}:${job.title}`
    byKey.set(key, job)
  }

  for (const job of incoming) {
    const key = `${job.companyId ?? job.company}:${job.title}`
    const prev = byKey.get(key)
    if (prev) {
      byKey.set(key, enrichJob({
        ...prev,
        ...job,
        id: prev.id,
        description: prev.description?.length > job.description?.length ? prev.description : job.description,
        requirements: prev.requirements || job.requirements,
        url: job.url || prev.url,
        fetchedAt: job.fetchedAt,
        status: 'active',
        isOutsourcingManual: prev.isOutsourcingManual,
        isOutsourcing: prev.isOutsourcingManual ? prev.isOutsourcing : undefined,
      }))
    } else {
      byKey.set(key, enrichJob(job))
    }
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(b.fetchedAt ?? 0).getTime() - new Date(a.fetchedAt ?? 0).getTime(),
  )
}

/**
 * 手动导入岗位 JD
 * @param {object} input
 * @returns {object}
 */
export function createManualJob(input) {
  const description = input.description?.trim() ?? ''
  const requirements = input.requirements?.trim() ?? ''
  const fullText = `${input.title}\n${description}\n${requirements}`
  const keywords = extractKeywords(fullText)

  return enrichJob({
    id: crypto.randomUUID(),
    company: input.company?.trim() || '未命名公司',
    companyId: input.companyId || 'manual',
    title: input.title?.trim() || '未命名岗位',
    url: input.url?.trim() || '',
    description,
    requirements,
    extractedKeywords: keywords,
    source: 'manual',
    fetchedAt: new Date().toISOString(),
    status: 'active',
  })
}
