#!/usr/bin/env node
/**
 * 将定制简历导出为静态 JSON，供 Cloudflare Pages 等纯静态托管使用。
 * 输出：public/variants/<id>.json
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const VARIANTS_PATH = path.join(ROOT, 'server/data/variants.json')
const OUT_DIR = path.join(ROOT, 'public/variants')

const raw = await fs.readFile(VARIANTS_PATH, 'utf-8').catch(() => '{"variants":[]}')
const store = JSON.parse(raw)
const variants = store.variants ?? []

await fs.mkdir(OUT_DIR, { recursive: true })
const existing = await fs.readdir(OUT_DIR).catch(() => [])
await Promise.all(
  existing
    .filter((name) => name.endsWith('.json'))
    .map((name) => fs.unlink(path.join(OUT_DIR, name))),
)

let count = 0
for (const variant of variants) {
  if (!variant?.id) continue
  const payload = {
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
  }
  await fs.writeFile(
    path.join(OUT_DIR, `${variant.id}.json`),
    JSON.stringify(payload),
    'utf-8',
  )
  count += 1
}

console.log(`已导出 ${count} 份定制简历到 public/variants/`)
