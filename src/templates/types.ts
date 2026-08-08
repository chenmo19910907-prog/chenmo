import {
  ATELIER_COLOR_TEMPLATE_IDS,
  EXECUTIVE_COLOR_TEMPLATE_IDS,
  FOLIO_COLOR_TEMPLATE_IDS,
  LEDGER_COLOR_TEMPLATE_IDS,
  PREMIUM_COLOR_TEMPLATE_IDS,
} from './premiumTemplateIds'

export {
  ATELIER_COLOR_TEMPLATE_IDS,
  EXECUTIVE_COLOR_TEMPLATE_IDS,
  FOLIO_COLOR_TEMPLATE_IDS,
  LEDGER_COLOR_TEMPLATE_IDS,
  PREMIUM_COLOR_TEMPLATE_IDS,
}

export const STANDARD_COLOR_TEMPLATE_IDS = [
  'default',
  'classic',
  'minimal',
  'elegant',
] as const

export const SIDEBAR_COLOR_TEMPLATE_IDS = [
  'sidebar',
  'sidebar-navy',
  'sidebar-forest',
  'sidebar-wine',
] as const

export const TIMELINE_COLOR_TEMPLATE_IDS = [
  'timeline',
  'timeline-blue',
  'timeline-teal',
  'timeline-rose',
] as const

export const MAGAZINE_COLOR_TEMPLATE_IDS = [
  'magazine',
  'magazine-midnight',
  'magazine-forest',
  'magazine-wine',
] as const

export const LAYOUT_ONLY_TEMPLATE_IDS = [
  ...SIDEBAR_COLOR_TEMPLATE_IDS,
  ...TIMELINE_COLOR_TEMPLATE_IDS,
  ...MAGAZINE_COLOR_TEMPLATE_IDS,
  ...PREMIUM_COLOR_TEMPLATE_IDS,
] as const

export const RESUME_TEMPLATE_IDS = [
  ...STANDARD_COLOR_TEMPLATE_IDS,
  ...LAYOUT_ONLY_TEMPLATE_IDS,
] as const

export type StandardColorTemplateId = (typeof STANDARD_COLOR_TEMPLATE_IDS)[number]
export type SidebarColorTemplateId = (typeof SIDEBAR_COLOR_TEMPLATE_IDS)[number]
export type TimelineColorTemplateId = (typeof TIMELINE_COLOR_TEMPLATE_IDS)[number]
export type MagazineColorTemplateId = (typeof MAGAZINE_COLOR_TEMPLATE_IDS)[number]
export type ExecutiveColorTemplateId = (typeof EXECUTIVE_COLOR_TEMPLATE_IDS)[number]
export type FolioColorTemplateId = (typeof FOLIO_COLOR_TEMPLATE_IDS)[number]
export type LedgerColorTemplateId = (typeof LEDGER_COLOR_TEMPLATE_IDS)[number]
export type AtelierColorTemplateId = (typeof ATELIER_COLOR_TEMPLATE_IDS)[number]
export type LayoutOnlyTemplateId = (typeof LAYOUT_ONLY_TEMPLATE_IDS)[number]
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number]

export const RESUME_LAYOUT_IDS = [
  'standard',
  'sidebar',
  'timeline',
  'magazine',
  'executive',
  'folio',
  'ledger',
  'atelier',
] as const

export type ResumeLayoutId = (typeof RESUME_LAYOUT_IDS)[number]

export const DEFAULT_RESUME_TEMPLATE_ID: ResumeTemplateId = 'default'

export interface TemplateColorOption {
  id: ResumeTemplateId
  label: string
  swatchClass: string
}

export interface LayoutTemplateOption {
  id: ResumeLayoutId
  label: string
  description: string
  layout: ResumeLayoutId
  defaultTemplateId: ResumeTemplateId
  swatchClass: string
  tier: 'classic' | 'premium'
}

export function isResumeTemplateId(value: string | undefined): value is ResumeTemplateId {
  return RESUME_TEMPLATE_IDS.includes(value as ResumeTemplateId)
}

export function isStandardColorTemplate(
  value: string | undefined,
): value is StandardColorTemplateId {
  return STANDARD_COLOR_TEMPLATE_IDS.includes(value as StandardColorTemplateId)
}

export function isSidebarColorTemplate(
  value: string | undefined,
): value is SidebarColorTemplateId {
  return SIDEBAR_COLOR_TEMPLATE_IDS.includes(value as SidebarColorTemplateId)
}

export function isTimelineColorTemplate(
  value: string | undefined,
): value is TimelineColorTemplateId {
  return TIMELINE_COLOR_TEMPLATE_IDS.includes(value as TimelineColorTemplateId)
}

export function isMagazineColorTemplate(
  value: string | undefined,
): value is MagazineColorTemplateId {
  return MAGAZINE_COLOR_TEMPLATE_IDS.includes(value as MagazineColorTemplateId)
}

export function isExecutiveColorTemplate(
  value: string | undefined,
): value is ExecutiveColorTemplateId {
  return EXECUTIVE_COLOR_TEMPLATE_IDS.includes(value as ExecutiveColorTemplateId)
}

export function isFolioColorTemplate(value: string | undefined): value is FolioColorTemplateId {
  return FOLIO_COLOR_TEMPLATE_IDS.includes(value as FolioColorTemplateId)
}

export function isLedgerColorTemplate(
  value: string | undefined,
): value is LedgerColorTemplateId {
  return LEDGER_COLOR_TEMPLATE_IDS.includes(value as LedgerColorTemplateId)
}

export function isAtelierColorTemplate(
  value: string | undefined,
): value is AtelierColorTemplateId {
  return ATELIER_COLOR_TEMPLATE_IDS.includes(value as AtelierColorTemplateId)
}

const LAYOUT_DEFAULT_TEMPLATE: Record<ResumeLayoutId, ResumeTemplateId> = {
  standard: 'default',
  sidebar: 'sidebar',
  timeline: 'timeline',
  magazine: 'magazine',
  executive: 'executive',
  folio: 'folio',
  ledger: 'ledger',
  atelier: 'atelier',
}

export function getTemplateLayout(templateId: ResumeTemplateId): ResumeLayoutId {
  if (isStandardColorTemplate(templateId)) return 'standard'
  if (isSidebarColorTemplate(templateId)) return 'sidebar'
  if (isTimelineColorTemplate(templateId)) return 'timeline'
  if (isMagazineColorTemplate(templateId)) return 'magazine'
  if (isExecutiveColorTemplate(templateId)) return 'executive'
  if (isFolioColorTemplate(templateId)) return 'folio'
  if (isLedgerColorTemplate(templateId)) return 'ledger'
  if (isAtelierColorTemplate(templateId)) return 'atelier'
  return 'standard'
}

export function getDefaultTemplateForLayout(layout: ResumeLayoutId): ResumeTemplateId {
  return LAYOUT_DEFAULT_TEMPLATE[layout]
}

export function isTemplateInLayout(
  templateId: ResumeTemplateId,
  layout: ResumeLayoutId,
): boolean {
  return getTemplateLayout(templateId) === layout
}

export function resolveResumeTemplateId(value: string | undefined): ResumeTemplateId {
  if (isResumeTemplateId(value)) return value
  return DEFAULT_RESUME_TEMPLATE_ID
}

export function getActiveLayoutTemplateId(templateId: ResumeTemplateId): ResumeTemplateId {
  return getDefaultTemplateForLayout(getTemplateLayout(templateId))
}
