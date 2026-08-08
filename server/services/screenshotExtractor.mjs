import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parseJdText } from './applicationAssistant.mjs'
import { mergeParsedJobInfo } from './jobAnalysis.mjs'
import { extractJobInfoFromScreenshot as extractViaLlm } from './llmService.mjs'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OCR_SCRIPT = path.join(__dirname, '../scripts/ocr-image.swift')

function base64ToBuffer(base64Image) {
  const match = base64Image.match(/^data:image\/\w+;base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[1], 'base64')
}

async function ocrImageBuffer(buffer, ext = 'png') {
  if (process.platform !== 'darwin') return ''

  const tempPath = path.join(
    os.tmpdir(),
    `chenmo-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
  )

  try {
    await fs.writeFile(tempPath, buffer)
    const { stdout } = await execFileAsync('swift', [OCR_SCRIPT, tempPath], {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    })
    return stdout.trim()
  } catch (err) {
    console.error('[ocr] vision failed:', err.message)
    return ''
  } finally {
    await fs.unlink(tempPath).catch(() => {})
  }
}

export async function ocrScreenshotBase64(base64Image) {
  const buffer = base64ToBuffer(base64Image)
  if (!buffer) return ''

  const extMatch = base64Image.match(/^data:image\/(\w+);base64,/)
  const ext = extMatch?.[1] === 'jpeg' ? 'jpg' : extMatch?.[1] || 'png'
  return ocrImageBuffer(buffer, ext)
}

function parsedFromOcrText(text) {
  if (!text?.trim()) return null
  const parsed = parseJdText(text)
  const hasStructured =
    parsed.company?.trim() ||
    parsed.title?.trim() ||
    parsed.description?.trim() ||
    parsed.requirements?.trim()

  if (hasStructured) return parsed

  return {
    company: '',
    title: '',
    description: text.trim(),
    requirements: '',
    channel: 'boss',
  }
}

async function extractViaOcr(base64Image) {
  const text = await ocrScreenshotBase64(base64Image)
  return parsedFromOcrText(text)
}

async function extractFromSingleScreenshot(base64Image) {
  let llmResult = null
  try {
    llmResult = await extractViaLlm(base64Image)
  } catch (err) {
    console.error('[screenshot] llm extract failed:', err.message)
  }

  let ocrResult = null
  try {
    ocrResult = await extractViaOcr(base64Image)
  } catch (err) {
    console.error('[screenshot] ocr extract failed:', err.message)
  }

  if (llmResult && ocrResult) {
    return mergeParsedJobInfo(ocrResult, llmResult)
  }
  return llmResult ?? ocrResult
}

const EMPTY_PARSED = {
  company: '',
  title: '',
  description: '',
  requirements: '',
  salary: '',
  location: '',
  channel: 'boss',
}

/** 从一张或多张招聘截图提取公司与 JD（LLM 优先，macOS Vision OCR 兜底） */
export async function extractJobInfoFromScreenshots(base64Images = []) {
  if (!base64Images.length) return null

  let merged = { ...EMPTY_PARSED }

  for (const image of base64Images) {
    const parsed = await extractFromSingleScreenshot(image)
    if (parsed) merged = mergeParsedJobInfo(merged, parsed)
  }

  const hasContent =
    merged.company?.trim() ||
    merged.title?.trim() ||
    merged.description?.trim() ||
    merged.requirements?.trim()

  return hasContent ? merged : null
}
