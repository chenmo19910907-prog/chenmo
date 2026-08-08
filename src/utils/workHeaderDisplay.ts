function normalizeHeaderText(text: string): string {
  return text
    .replace(/[「」《》·\s：:，,。；;]/g, '')
    .toLowerCase()
}

function isRedundantHeaderText(a: string, b: string): boolean {
  const left = normalizeHeaderText(a)
  const right = normalizeHeaderText(b)
  if (!left || !right) return false
  if (left === right) return true
  if (left.length >= 4 && right.length >= 4) {
    return left.includes(right) || right.includes(left)
  }
  return false
}

/** 详情页头部：职位、标语、团队标签去重，避免三处重复同一句话 */
export function resolveWorkHeaderDisplay({
  position,
  tagline,
  teamInfo,
}: {
  position: string
  tagline?: string
  teamInfo?: string
}) {
  const taglineText = tagline?.trim() ?? ''
  const teamInfoText = teamInfo?.trim() ?? ''

  const showTagline =
    Boolean(taglineText) &&
    !isRedundantHeaderText(taglineText, position) &&
    !(teamInfoText && isRedundantHeaderText(taglineText, teamInfoText))

  const showTeamInfo =
    Boolean(teamInfoText) &&
    !isRedundantHeaderText(teamInfoText, position) &&
    !(showTagline && isRedundantHeaderText(teamInfoText, taglineText))

  return {
    showTagline,
    showTeamInfo,
    tagline: taglineText,
    teamInfo: teamInfoText,
  }
}
