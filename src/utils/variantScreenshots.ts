import type { ResumeVariant } from '../types/job'

export function getVariantScreenshotUrls(
  variant: Pick<ResumeVariant, 'screenshotUrl' | 'screenshotUrls'>,
): string[] {
  if (variant.screenshotUrls?.length) return variant.screenshotUrls
  if (variant.screenshotUrl) return [variant.screenshotUrl]
  return []
}
