/** 列表：每行一条 */
export function listToLines(items: string[]): string {
  return items.join('\n')
}

export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** 多段落：空行分隔 */
export function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.join('\n\n')
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

const BLOCK_SEP = '\n\n---\n\n'

/** 概述 + 要点列表，用 --- 分隔 */
export function serializeOverviewWithPoints(overview: string, points: string[]): string {
  if (points.length === 0) return overview
  return `${overview}${BLOCK_SEP}${listToLines(points)}`
}

export function parseOverviewWithPoints(text: string): {
  overview: string
  points: string[]
} {
  const parts = text.split(/\n\s*---\s*\n/)
  if (parts.length === 1) {
    return { overview: parts[0].trim(), points: [] }
  }
  return {
    overview: parts[0].trim(),
    points: linesToList(parts.slice(1).join('\n')),
  }
}

export interface ParsedProject {
  name: string
  description: string
  highlights: string[]
}

export function serializeProjects(
  projects: { name: string; description: string; highlights?: string[] }[],
): string {
  return projects
    .map((project) => {
      const highlightLines = (project.highlights ?? []).map((item) => `- ${item}`).join('\n')
      return `## ${project.name}\n${project.description}${
        highlightLines ? `\n${highlightLines}` : ''
      }`
    })
    .join('\n\n')
}

export function parseProjects(text: string): ParsedProject[] {
  const blocks = text
    .split(/\n(?=## )/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block) => {
    const lines = block.split('\n')
    const name = lines[0]?.replace(/^##\s*/, '').trim() ?? ''
    const highlights: string[] = []
    const descriptionLines: string[] = []

    for (const line of lines.slice(1)) {
      if (line.startsWith('- ')) {
        highlights.push(line.slice(2).trim())
      } else {
        descriptionLines.push(line)
      }
    }

    return {
      name,
      description: descriptionLines.join('\n').trim(),
      highlights,
    }
  })
}

export interface ParsedHighlight {
  title: string
  description: string
}

export function serializeHighlights(items: ParsedHighlight[]): string {
  return items.map((item) => `${item.title}\n${item.description}`).join(BLOCK_SEP)
}

export function parseHighlights(text: string): ParsedHighlight[] {
  return text
    .split(/\n\s*---\s*\n/)
    .map((block) => {
      const lines = block.split('\n')
      return {
        title: lines[0]?.trim() ?? '',
        description: lines.slice(1).join('\n').trim(),
      }
    })
    .filter((item) => item.title)
}

export function serializeLabeledLines(
  entries: { label: string; value: string }[],
): string {
  return entries.map((entry) => `${entry.label}：${entry.value}`).join('\n')
}

export function parseLabeledLines(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of linesToList(text)) {
    const index = line.indexOf('：')
    if (index === -1) continue
    result[line.slice(0, index).trim()] = line.slice(index + 1).trim()
  }
  return result
}

export function serializeWorkCard(work: {
  startDate: string
  endDate: string
  company: string
  position: string
  summary: string
  tools: string[]
}): string {
  const lines = [
    `${work.startDate} — ${work.endDate}`,
    work.company,
    work.position,
    '',
    work.summary,
  ]
  if (work.tools.length > 0) {
    lines.push('', `工具：${work.tools.join('、')}`)
  }
  return lines.join('\n')
}

export function parseWorkCard(text: string): {
  startDate: string
  endDate: string
  company: string
  position: string
  summary: string
  tools: string[]
} {
  const lines = text.split('\n')
  const nonEmpty = lines.map((line) => line.trim())
  const dateLine = nonEmpty[0] ?? ''
  const [startDate = '', endDate = ''] = dateLine.split('—').map((part) => part.trim())
  const company = nonEmpty[1] ?? ''
  const position = nonEmpty[2] ?? ''

  let summary = ''
  const tools: string[] = []
  let summaryStarted = false

  for (const line of lines.slice(3)) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (summaryStarted) summary += '\n'
      continue
    }
    if (trimmed.startsWith('工具：') || trimmed.startsWith('工具:')) {
      const toolText = trimmed.replace(/^工具[：:]/, '').trim()
      tools.push(...toolText.split(/[、,，]/).map((item) => item.trim()).filter(Boolean))
      continue
    }
    summaryStarted = true
    summary += (summary ? '\n' : '') + trimmed
  }

  return { startDate, endDate, company, position, summary: summary.trim(), tools }
}

export function serializeWorkHeader(work: {
  startDate: string
  endDate: string
  company: string
  position: string
  tagline?: string
  teamInfo?: string
}): string {
  const parts = [
    [`${work.startDate} — ${work.endDate}`, work.company, work.position].join('\n'),
  ]
  if (work.tagline) parts.push(work.tagline)
  if (work.teamInfo) parts.push(work.teamInfo)
  return parts.join('\n\n')
}

export function parseWorkHeader(text: string): {
  startDate: string
  endDate: string
  company: string
  position: string
  tagline: string
  teamInfo: string
} {
  const parts = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  const headerLines = parts[0]?.split('\n').map((line) => line.trim()) ?? []
  const [startDate = '', endDate = ''] = (headerLines[0] ?? '')
    .split('—')
    .map((part) => part.trim())

  return {
    startDate,
    endDate,
    company: headerLines[1] ?? '',
    position: headerLines[2] ?? '',
    tagline: parts[1] ?? '',
    teamInfo: parts[2] ?? '',
  }
}

export function serializeHero(profile: {
  name: string
  title: string
  tagline: string
  contact: { phone?: string; email?: string; location?: string; degree?: string }
}): string {
  return [
    [profile.name, profile.title, profile.tagline].join('\n'),
    serializeLabeledLines([
      { label: '电话', value: profile.contact.phone ?? '' },
      { label: '邮箱', value: profile.contact.email ?? '' },
      { label: '地点', value: profile.contact.location ?? '' },
      { label: '学历', value: profile.contact.degree ?? '' },
    ]),
  ].join('\n\n')
}

export function parseHero(text: string): {
  name: string
  title: string
  tagline: string
  contact: { phone?: string; email?: string; location?: string; degree?: string }
} {
  const parts = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  const headLines = parts[0]?.split('\n').map((line) => line.trim()) ?? []
  const labeled = parseLabeledLines(parts[1] ?? '')

  return {
    name: headLines[0] ?? '',
    title: headLines[1] ?? '',
    tagline: headLines[2] ?? '',
    contact: {
      phone: labeled['电话'],
      email: labeled['邮箱'],
      location: labeled['地点'],
      degree: labeled['学历'],
    },
  }
}
