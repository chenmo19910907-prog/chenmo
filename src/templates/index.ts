import { DOCX_RESUME_THEMES } from './docxThemes'
import { WEB_RESUME_THEMES } from './webThemes'
import {
  ATELIER_COLOR_TEMPLATE_IDS,
  DEFAULT_RESUME_TEMPLATE_ID,
  EXECUTIVE_COLOR_TEMPLATE_IDS,
  FOLIO_COLOR_TEMPLATE_IDS,
  LEDGER_COLOR_TEMPLATE_IDS,
  LAYOUT_ONLY_TEMPLATE_IDS,
  MAGAZINE_COLOR_TEMPLATE_IDS,
  PREMIUM_COLOR_TEMPLATE_IDS,
  RESUME_TEMPLATE_IDS,
  SIDEBAR_COLOR_TEMPLATE_IDS,
  STANDARD_COLOR_TEMPLATE_IDS,
  TIMELINE_COLOR_TEMPLATE_IDS,
  type LayoutTemplateOption,
  type ResumeLayoutId,
  type ResumeTemplateId,
  type TemplateColorOption,
  getActiveLayoutTemplateId,
  getDefaultTemplateForLayout,
  getTemplateLayout,
  isAtelierColorTemplate,
  isExecutiveColorTemplate,
  isFolioColorTemplate,
  isLedgerColorTemplate,
  isMagazineColorTemplate,
  isResumeTemplateId,
  isSidebarColorTemplate,
  isStandardColorTemplate,
  isTemplateInLayout,
  isTimelineColorTemplate,
  resolveResumeTemplateId,
} from './types'

export {
  ATELIER_COLOR_TEMPLATE_IDS,
  DEFAULT_RESUME_TEMPLATE_ID,
  EXECUTIVE_COLOR_TEMPLATE_IDS,
  FOLIO_COLOR_TEMPLATE_IDS,
  LEDGER_COLOR_TEMPLATE_IDS,
  LAYOUT_ONLY_TEMPLATE_IDS,
  MAGAZINE_COLOR_TEMPLATE_IDS,
  PREMIUM_COLOR_TEMPLATE_IDS,
  RESUME_TEMPLATE_IDS,
  SIDEBAR_COLOR_TEMPLATE_IDS,
  STANDARD_COLOR_TEMPLATE_IDS,
  TIMELINE_COLOR_TEMPLATE_IDS,
  type LayoutTemplateOption,
  type ResumeLayoutId,
  type ResumeTemplateId,
  type TemplateColorOption,
  getActiveLayoutTemplateId,
  getDefaultTemplateForLayout,
  getTemplateLayout,
  isAtelierColorTemplate,
  isExecutiveColorTemplate,
  isFolioColorTemplate,
  isLedgerColorTemplate,
  isMagazineColorTemplate,
  isResumeTemplateId,
  isSidebarColorTemplate,
  isStandardColorTemplate,
  isTemplateInLayout,
  isTimelineColorTemplate,
  resolveResumeTemplateId,
}

/** @deprecated 使用 TemplateColorOption */
export type StandardColorOption = TemplateColorOption

export const STANDARD_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'default', label: '清简蓝', swatchClass: 'bg-blue-600' },
  { id: 'classic', label: '经典黑', swatchClass: 'bg-slate-900' },
  { id: 'minimal', label: '极简灰', swatchClass: 'bg-slate-300' },
  { id: 'elegant', label: '雅致靛', swatchClass: 'bg-indigo-600' },
]

export const SIDEBAR_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'sidebar', label: '墨夜金', swatchClass: 'bg-slate-900' },
  { id: 'sidebar-navy', label: '深海蓝', swatchClass: 'bg-blue-950' },
  { id: 'sidebar-forest', label: '森翠绿', swatchClass: 'bg-emerald-950' },
  { id: 'sidebar-wine', label: '酒红', swatchClass: 'bg-rose-950' },
]

export const TIMELINE_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'timeline', label: '经典黑', swatchClass: 'bg-slate-900' },
  { id: 'timeline-blue', label: '静谧蓝', swatchClass: 'bg-blue-700' },
  { id: 'timeline-teal', label: '青绿', swatchClass: 'bg-teal-700' },
  { id: 'timeline-rose', label: '玫瑰', swatchClass: 'bg-rose-700' },
]

export const MAGAZINE_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'magazine', label: '暖琥珀', swatchClass: 'bg-amber-800' },
  { id: 'magazine-midnight', label: '午夜靛', swatchClass: 'bg-indigo-950' },
  { id: 'magazine-forest', label: '墨绿', swatchClass: 'bg-emerald-900' },
  { id: 'magazine-wine', label: '酒红', swatchClass: 'bg-rose-900' },
]

export const EXECUTIVE_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'executive', label: '香槟金', swatchClass: 'bg-amber-700' },
  { id: 'executive-noir', label: '墨黑', swatchClass: 'bg-neutral-900' },
  { id: 'executive-slate', label: '岩板灰', swatchClass: 'bg-slate-600' },
  { id: 'executive-bronze', label: '青铜', swatchClass: 'bg-amber-900' },
]

export const FOLIO_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'folio', label: '雾白', swatchClass: 'bg-stone-300' },
  { id: 'folio-midnight', label: '午夜', swatchClass: 'bg-slate-950' },
  { id: 'folio-sage', label: '鼠尾草', swatchClass: 'bg-emerald-700' },
  { id: 'folio-plum', label: '李紫', swatchClass: 'bg-violet-700' },
]

export const LEDGER_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'ledger', label: '藏书蓝', swatchClass: 'bg-slate-900' },
  { id: 'ledger-burgundy', label: '勃艮第', swatchClass: 'bg-rose-950' },
  { id: 'ledger-forest', label: '墨绿', swatchClass: 'bg-emerald-950' },
  { id: 'ledger-graphite', label: '石墨', swatchClass: 'bg-zinc-700' },
]

export const ATELIER_COLOR_OPTIONS: TemplateColorOption[] = [
  { id: 'atelier', label: '素白', swatchClass: 'bg-stone-200' },
  { id: 'atelier-ink', label: '墨韵', swatchClass: 'bg-neutral-800' },
  { id: 'atelier-stone', label: '暖石', swatchClass: 'bg-amber-600' },
  { id: 'atelier-moss', label: '苔绿', swatchClass: 'bg-emerald-600' },
]

export const LAYOUT_COLOR_OPTIONS: Record<ResumeLayoutId, TemplateColorOption[]> = {
  standard: STANDARD_COLOR_OPTIONS,
  sidebar: SIDEBAR_COLOR_OPTIONS,
  timeline: TIMELINE_COLOR_OPTIONS,
  magazine: MAGAZINE_COLOR_OPTIONS,
  executive: EXECUTIVE_COLOR_OPTIONS,
  folio: FOLIO_COLOR_OPTIONS,
  ledger: LEDGER_COLOR_OPTIONS,
  atelier: ATELIER_COLOR_OPTIONS,
}

export const CLASSIC_LAYOUT_OPTIONS: LayoutTemplateOption[] = [
  {
    id: 'standard',
    label: '清简通栏',
    description: '居中页眉 + 左侧色条分区，经典求职简历',
    layout: 'standard',
    defaultTemplateId: 'default',
    swatchClass: 'bg-blue-600',
    tier: 'classic',
  },
  {
    id: 'sidebar',
    label: '商务侧栏',
    description: '深色侧栏放联系方式与学历，主栏突出经历',
    layout: 'sidebar',
    defaultTemplateId: 'sidebar',
    swatchClass: 'bg-slate-800',
    tier: 'classic',
  },
  {
    id: 'timeline',
    label: '时间轴',
    description: '左对齐标题 + 纵向时间轴串联工作经历',
    layout: 'timeline',
    defaultTemplateId: 'timeline',
    swatchClass: 'bg-slate-500',
    tier: 'classic',
  },
  {
    id: 'magazine',
    label: '杂志专栏',
    description: '衬线字体 + 深色页眉 + 双栏分区卡片式经历',
    layout: 'magazine',
    defaultTemplateId: 'magazine',
    swatchClass: 'bg-amber-800',
    tier: 'classic',
  },
]

export const PREMIUM_LAYOUT_OPTIONS: LayoutTemplateOption[] = [
  {
    id: 'executive',
    label: '高管典雅',
    description: '衬线大标题 + 金色分隔线，奢华留白与精致字距',
    layout: 'executive',
    defaultTemplateId: 'executive',
    swatchClass: 'bg-amber-700',
    tier: 'premium',
  },
  {
    id: 'folio',
    label: '策展留白',
    description: '左栏身份信息 + 右栏内容，画廊式不对称编排',
    layout: 'folio',
    defaultTemplateId: 'folio',
    swatchClass: 'bg-stone-400',
    tier: 'premium',
  },
  {
    id: 'ledger',
    label: '学府典籍',
    description: '深色页眉 + 侧栏分区标题，学院派卡片式经历',
    layout: 'ledger',
    defaultTemplateId: 'ledger',
    swatchClass: 'bg-slate-900',
    tier: 'premium',
  },
  {
    id: 'atelier',
    label: '工坊极简',
    description: '超宽字距 + 发丝线分隔，日式极简高级感',
    layout: 'atelier',
    defaultTemplateId: 'atelier',
    swatchClass: 'bg-stone-300',
    tier: 'premium',
  },
]

/** @deprecated 使用 CLASSIC_LAYOUT_OPTIONS 与 PREMIUM_LAYOUT_OPTIONS */
export const LAYOUT_TEMPLATE_OPTIONS: LayoutTemplateOption[] = [
  ...CLASSIC_LAYOUT_OPTIONS,
  ...PREMIUM_LAYOUT_OPTIONS,
]

export function getLayoutColorOptions(layout: ResumeLayoutId): TemplateColorOption[] {
  return LAYOUT_COLOR_OPTIONS[layout]
}

export function getWebTheme(templateId: ResumeTemplateId) {
  return WEB_RESUME_THEMES[resolveResumeTemplateId(templateId)]
}

export function getDocxTheme(templateId: ResumeTemplateId) {
  return DOCX_RESUME_THEMES[resolveResumeTemplateId(templateId)]
}
