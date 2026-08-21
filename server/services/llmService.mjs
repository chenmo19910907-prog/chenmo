import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, '../config/llm.json')
const EXAMPLE_PATH = path.join(__dirname, '../config/llm.example.json')

async function loadLlmConfig() {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'))
  } catch {
    return {
      enabled: Boolean(process.env.CHENMO_LLM_API_KEY),
      baseUrl: process.env.CHENMO_LLM_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.CHENMO_LLM_API_KEY || '',
      model: process.env.CHENMO_LLM_MODEL || 'gpt-4o-mini',
      timeoutMs: 60000,
    }
  }
}

export async function getLlmStatus() {
  const cfg = await loadLlmConfig()
  return {
    enabled: Boolean(cfg.enabled && cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    configPath: CONFIG_PATH,
  }
}

export async function callLlm(systemPrompt, userPrompt) {
  const cfg = await loadLlmConfig()
  if (!cfg.enabled || !cfg.apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 60000)

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } finally {
    clearTimeout(timer)
  }
}

async function callLlmMessages(messages, temperature = 0.3) {
  const cfg = await loadLlmConfig()
  if (!cfg.enabled || !cfg.apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 60000)

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature,
        messages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } finally {
    clearTimeout(timer)
  }
}

function parseJsonObject(text) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

/** 从招聘截图中识别公司与岗位信息（需配置 LLM 且模型支持识图） */
export async function extractJobInfoFromScreenshot(base64Image) {
  if (!base64Image?.startsWith('data:image')) return null

  const content = await callLlmMessages(
    [
      {
        role: 'system',
        content:
          '你是招聘信息解析助手。从 Boss 直聘/猎聘等招聘截图中提取结构化信息，只返回 JSON，不要 markdown。',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '提取字段：company, title, description, requirements, salary, location。description 与 requirements 须完整保留截图中的全部职责/要求条目（含所有编号项），不要省略。缺失字段用空字符串。只返回 JSON 对象。',
          },
          { type: 'image_url', image_url: { url: base64Image } },
        ],
      },
    ],
    0.1,
  )

  const parsed = parseJsonObject(content)
  if (!parsed) return null

  return {
    company: String(parsed.company ?? '').trim(),
    title: String(parsed.title ?? '').trim(),
    description: String(parsed.description ?? '').trim(),
    requirements: String(parsed.requirements ?? '').trim(),
    salary: String(parsed.salary ?? '').trim(),
    location: String(parsed.location ?? '').trim(),
    channel: 'boss',
  }
}

export async function polishCoverLetter(draft, job, profile) {
  const system = `你是资深职业顾问，帮助测试工程师撰写求职信。要求：真实不编造、简体中文、300字以内、突出业务专家视角的语音房社交测试经验。求职方向：${profile}。`
  const user = `请润色以下求职信，使其更自然、更有说服力，保留事实不变：

目标岗位：${job.company} · ${job.title}

---
${draft}
---`

  return callLlm(system, user)
}

export async function polishSelfIntro(draft, job, profile) {
  const system = `你是面试教练，帮助优化1分钟自我介绍。要求：口语化、简体中文、200字以内、可朗读约60秒。方向：${profile}。`
  const user = `润色以下自我介绍：

岗位：${job.company} · ${job.title}

---
${draft}
---`

  return callLlm(system, user)
}

export async function initLlmConfigIfMissing() {
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
