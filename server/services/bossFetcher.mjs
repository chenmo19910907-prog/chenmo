import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, '../config/boss.json')
const EXAMPLE_PATH = path.join(__dirname, '../config/boss.example.json')

async function loadBossConfig() {
  try {
    const raw = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'))
    return {
      ...raw,
      cookie: process.env.CHENMO_BOSS_COOKIE || raw.cookie || '',
    }
  } catch {
    return {
      enabled: false,
      city: '101010100',
      queries: ['测试工程师 语音房'],
      cookie: process.env.CHENMO_BOSS_COOKIE || '',
    }
  }
}

export async function getBossStatus() {
  const cfg = await loadBossConfig()
  let playwrightAvailable = false
  try {
    await import('playwright')
    playwrightAvailable = true
  } catch {
    /* ignore */
  }
  return {
    enabled: Boolean(cfg.enabled && cfg.cookie),
    playwrightAvailable,
    queries: cfg.queries ?? [],
    configPath: CONFIG_PATH,
  }
}

export async function fetchBossJobs(globalKeywords = []) {
  const cfg = await loadBossConfig()
  if (!cfg.enabled || !cfg.cookie) {
    return { jobs: [], error: 'Boss 直聘未配置或未启用，请配置 server/config/boss.json' }
  }

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    return { jobs: [], error: '未安装 playwright，请运行 npx playwright install chromium' }
  }

  const results = []
  const seen = new Set()
  const queries = cfg.queries?.length ? cfg.queries : globalKeywords.slice(0, 3)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  await context.addCookies(
    cfg.cookie
      .split(';')
      .map((part) => {
        const [name, ...rest] = part.trim().split('=')
        return {
          name: name.trim(),
          value: rest.join('=').trim(),
          domain: '.zhipin.com',
          path: '/',
        }
      })
      .filter((c) => c.name && c.value),
  )

  const page = await context.newPage()

  try {
    for (const query of queries) {
      const url = `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(query)}&city=${cfg.city || '101010100'}`
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForTimeout(2000)

        const pageUrl = page.url()
        const pageTitle = await page.title()
        if (pageUrl.includes('/verify') || pageTitle.includes('安全验证')) {
          return {
            jobs: [],
            error:
              'Boss 直聘触发安全验证（滑块/人机校验），自动化浏览器无法通过。请在浏览器手动复制 JD 到求职助手导入，或稍后重试。',
          }
        }

        const items = await page.evaluate(() => {
          const cards = document.querySelectorAll('.job-card-wrapper, .job-card, li.job-card-box')
          const out = []
          cards.forEach((card) => {
            const titleEl = card.querySelector('.job-name, .job-title, a')
            const companyEl = card.querySelector('.company-name, .company-text')
            const salaryEl = card.querySelector('.salary')
            const linkEl = card.querySelector('a[href*="job_detail"], a[href*="jobs"]')
            const title = titleEl?.textContent?.trim() ?? ''
            const company = companyEl?.textContent?.trim() ?? ''
            const salary = salaryEl?.textContent?.trim() ?? ''
            const href = linkEl?.getAttribute('href') ?? ''
            if (title && title.length >= 2) {
              out.push({ title, company, salary, href })
            }
          })
          return out.slice(0, 15)
        })

        for (const item of items) {
          const lower = `${item.title} ${item.company}`.toLowerCase()
          const hit =
            globalKeywords.some((kw) => lower.includes(kw.toLowerCase())) ||
            /测试|qa|质量/i.test(item.title)
          if (!hit) continue

          const key = `${item.company}:${item.title}`
          if (seen.has(key)) continue
          seen.add(key)

          const jobUrl = item.href.startsWith('http')
            ? item.href
            : `https://www.zhipin.com${item.href.startsWith('/') ? '' : '/'}${item.href}`

          results.push({
            id: crypto.randomUUID(),
            company: item.company || 'Boss直聘',
            companyId: 'boss',
            title: item.title,
            url: jobUrl,
            description: `Boss直聘抓取 · ${query}${item.salary ? ` · ${item.salary}` : ''}`,
            requirements: '',
            source: 'boss',
            fetchedAt: new Date().toISOString(),
            status: 'active',
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[bossFetcher] query "${query}" failed:`, msg)
      }
    }
  } finally {
    await browser.close()
  }

  if (!results.length) {
    return {
      jobs: [],
      error: '未抓到岗位，Cookie 可能过期或页面结构变化，请更新 server/config/boss.json 中的 cookie',
    }
  }

  return { jobs: results, error: null }
}

export async function initBossConfigIfMissing() {
  try {
    await fs.access(CONFIG_PATH)
  } catch {
    try {
      const example = await fs.readFile(EXAMPLE_PATH, 'utf-8')
      await fs.writeFile(CONFIG_PATH, example, 'utf-8')
    } catch {
      /* ignore */
    }
  }
}
