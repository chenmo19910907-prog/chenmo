import type { ResumeLayoutId, ResumeTemplateId } from './types'
import { PREMIUM_WEB_THEMES } from './premiumWebThemes'
import { DOCX_RESUME_THEMES, type DocxResumeTheme } from './docxThemes'
import {
  themeBgClass,
  themeBorderClass,
  themeDecorationClass,
  themeTextClass,
} from './themeColorUtils'

export interface WebResumeTheme {
  id: ResumeTemplateId
  layout: ResumeLayoutId
  article: string
  sectionTitle: string
  sectionTitleSidebar?: string
  sectionTitleMagazine?: string
  header: string
  name: string
  subtitle: string
  contact: string
  contactLabel: string
  contactDot: string
  link: string
  body: string
  workBorder: string
  workCompany: string
  workPosition: string
  workDate: string
  featuredBadge: string
  educationCard: string
  educationSchool: string
  educationMeta: string
  bullet: string
  sidebar?: string
  sidebarMuted?: string
  timelineRail?: string
  timelineDot?: string
  magazineCard?: string
  leftRail?: string
  contentPanel?: string
}

const STANDARD_ARTICLE =
  'mx-auto max-w-[780px] overflow-visible rounded-xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/80 md:px-12 md:py-12'

const STANDARD_THEMES: Record<
  'default' | 'classic' | 'minimal' | 'elegant',
  Omit<WebResumeTheme, 'id' | 'layout'>
> = {
  default: {
    article: STANDARD_ARTICLE,
    sectionTitle:
      'mb-4 border-l-[3px] border-blue-600 pl-3 text-[13px] font-bold uppercase tracking-[0.18em] text-slate-800',
    header: 'border-b border-slate-100 pb-7 text-center',
    name: 'text-[28px] font-bold tracking-tight text-slate-900 md:text-[32px]',
    subtitle: 'mt-1.5 text-[15px] font-medium text-slate-500',
    contact:
      'mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-slate-500',
    contactLabel: 'text-slate-400',
    contactDot: 'text-slate-300',
    link: 'ml-1 text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700',
    body: 'text-[14px] leading-relaxed text-slate-600',
    workBorder: 'relative border-l border-slate-200 pl-4',
    workCompany: 'text-[15px] font-semibold text-slate-900',
    workPosition: 'mt-0.5 text-[13px] text-slate-500',
    workDate: 'shrink-0 text-[12px] tabular-nums text-slate-400',
    featuredBadge: 'rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700',
    educationCard: 'rounded-lg bg-slate-50 px-3 py-2 text-[14px]',
    educationSchool: 'font-medium text-slate-800',
    educationMeta: 'font-normal text-slate-500',
    bullet: 'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/70',
  },
  classic: {
    article:
      'mx-auto max-w-[780px] overflow-visible rounded-sm bg-white px-8 py-10 shadow-sm ring-1 ring-slate-300 md:px-12 md:py-12',
    sectionTitle:
      'mb-4 border-b-2 border-slate-900 pb-1.5 text-[12px] font-bold uppercase tracking-[0.22em] text-slate-900',
    header: 'border-b-2 border-slate-900 pb-7 text-center',
    name: 'text-[30px] font-bold tracking-tight text-slate-950 md:text-[34px]',
    subtitle: 'mt-2 text-[15px] font-medium text-slate-700',
    contact:
      'mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-slate-600',
    contactLabel: 'text-slate-500',
    contactDot: 'text-slate-400',
    link: 'ml-1 text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-slate-700',
    body: 'text-[14px] leading-relaxed text-slate-700',
    workBorder: 'relative border-l-2 border-slate-300 pl-4',
    workCompany: 'text-[15px] font-bold text-slate-950',
    workPosition: 'mt-0.5 text-[13px] text-slate-600',
    workDate: 'shrink-0 text-[12px] tabular-nums text-slate-500',
    featuredBadge:
      'rounded border border-slate-300 px-1.5 py-0.5 text-[11px] font-medium text-slate-700',
    educationCard: 'border border-slate-200 px-3 py-2 text-[14px]',
    educationSchool: 'font-semibold text-slate-900',
    educationMeta: 'font-normal text-slate-600',
    bullet: 'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-sm bg-slate-800',
  },
  minimal: {
    article:
      'mx-auto max-w-[780px] overflow-visible rounded-lg border border-slate-200 bg-white px-8 py-10 md:px-12 md:py-12',
    sectionTitle:
      'mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400',
    header: 'border-b border-dashed border-slate-200 pb-7 text-center',
    name: 'text-[26px] font-semibold tracking-tight text-slate-800 md:text-[30px]',
    subtitle: 'mt-1.5 text-[14px] text-slate-500',
    contact:
      'mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-slate-500',
    contactLabel: 'text-slate-400',
    contactDot: 'text-slate-300',
    link: 'ml-1 text-slate-700 underline decoration-slate-200 underline-offset-2 hover:text-slate-900',
    body: 'text-[14px] leading-relaxed text-slate-600',
    workBorder: 'relative pl-3',
    workCompany: 'text-[15px] font-medium text-slate-800',
    workPosition: 'mt-0.5 text-[13px] text-slate-500',
    workDate: 'shrink-0 text-[12px] tabular-nums text-slate-400',
    featuredBadge:
      'rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600',
    educationCard: 'text-[14px] text-slate-600',
    educationSchool: 'font-medium text-slate-800',
    educationMeta: 'font-normal text-slate-500',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rounded-full bg-slate-400',
  },
  elegant: {
    article:
      'mx-auto max-w-[780px] overflow-visible rounded-2xl bg-white px-8 py-10 shadow-md ring-1 ring-indigo-100 md:px-12 md:py-12 md:shadow-lg',
    sectionTitle:
      'mb-4 border-l-[3px] border-indigo-600 pl-3 text-[13px] font-bold uppercase tracking-[0.18em] text-indigo-950',
    header:
      'mb-8 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-6 text-center md:px-6 md:py-8',
    name: 'text-[28px] font-bold tracking-tight text-indigo-950 md:text-[32px]',
    subtitle: 'mt-1.5 text-[15px] font-medium text-indigo-700/80',
    contact:
      'mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-indigo-700/70',
    contactLabel: 'text-indigo-500/80',
    contactDot: 'text-indigo-300',
    link: 'ml-1 text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-800',
    body: 'text-[14px] leading-relaxed text-slate-600',
    workBorder: 'relative border-l border-indigo-200 pl-4',
    workCompany: 'text-[15px] font-semibold text-slate-900',
    workPosition: 'mt-0.5 text-[13px] text-indigo-700/70',
    workDate: 'shrink-0 text-[12px] tabular-nums text-indigo-400',
    featuredBadge: 'rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-800',
    educationCard: 'rounded-lg bg-indigo-50/60 px-3 py-2 text-[14px]',
    educationSchool: 'font-medium text-indigo-950',
    educationMeta: 'font-normal text-indigo-700/70',
    bullet: 'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/80',
  },
}

const SIDEBAR_BASE: Omit<WebResumeTheme, 'id' | 'layout' | 'sidebar' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'> = {
  article:
    'mx-auto flex max-w-[900px] overflow-visible rounded-lg bg-white shadow-md ring-1 ring-slate-200',
  sectionTitle: 'mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400',
  sectionTitleSidebar:
    'mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400',
  header: 'text-left',
  name: 'text-[26px] font-bold leading-tight tracking-tight text-white md:text-[30px]',
  subtitle: 'mt-2 text-[14px] font-medium text-slate-300',
  contact: 'mt-6 space-y-2.5 text-[13px] text-slate-300',
  contactLabel: 'text-slate-500',
  contactDot: 'hidden',
  body: 'text-[14px] leading-relaxed text-slate-600',
  workBorder: 'border-b border-slate-100 pb-6 last:border-0 last:pb-0',
  workCompany: 'text-[15px] font-bold text-slate-900',
  workDate: 'shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400',
  educationCard: 'text-[13px] leading-relaxed text-slate-200',
  educationSchool: 'font-semibold text-white',
  educationMeta: 'font-normal text-slate-400',
  sidebarMuted: 'text-slate-500',
}

const SIDEBAR_ACCENTS: Record<
  'sidebar' | 'sidebar-navy' | 'sidebar-forest' | 'sidebar-wine',
  Pick<WebResumeTheme, 'sidebar' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'>
> = {
  sidebar: {
    sidebar: 'w-[34%] shrink-0 bg-slate-900 px-7 py-9 md:px-8 md:py-10',
    link: 'text-amber-300 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-200',
    workPosition: 'mt-0.5 text-[13px] font-medium text-amber-700',
    featuredBadge:
      'rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800',
    bullet: 'mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500',
  },
  'sidebar-navy': {
    sidebar: 'w-[34%] shrink-0 bg-blue-950 px-7 py-9 md:px-8 md:py-10',
    link: 'text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200',
    workPosition: 'mt-0.5 text-[13px] font-medium text-sky-700',
    featuredBadge:
      'rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800',
    bullet: 'mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sky-500',
  },
  'sidebar-forest': {
    sidebar: 'w-[34%] shrink-0 bg-emerald-950 px-7 py-9 md:px-8 md:py-10',
    link: 'text-lime-300 underline decoration-lime-500/40 underline-offset-2 hover:text-lime-200',
    workPosition: 'mt-0.5 text-[13px] font-medium text-emerald-700',
    featuredBadge:
      'rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800',
    bullet: 'mt-[7px] h-1 w-1 shrink-0 rounded-full bg-emerald-500',
  },
  'sidebar-wine': {
    sidebar: 'w-[34%] shrink-0 bg-rose-950 px-7 py-9 md:px-8 md:py-10',
    link: 'text-rose-300 underline decoration-rose-500/40 underline-offset-2 hover:text-rose-200',
    workPosition: 'mt-0.5 text-[13px] font-medium text-rose-700',
    featuredBadge:
      'rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800',
    bullet: 'mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose-500',
  },
}

const TIMELINE_STRUCTURE = {
  article:
    'mx-auto max-w-[780px] overflow-visible border border-slate-200 bg-white px-8 py-10 md:px-12 md:py-12',
  contactLabel: 'sr-only',
  contactDot: 'hidden',
  workBorder: 'relative pl-8',
} as const

function timelineWebFromDocx(c: DocxResumeTheme): Omit<WebResumeTheme, 'id' | 'layout' | 'article' | 'contactLabel' | 'contactDot' | 'workBorder'> {
  return {
    header: `border-b pb-6 text-left ${themeBorderClass(c.headerDivider)}`,
    name: `text-[32px] font-light tracking-tight md:text-[36px] ${themeTextClass(c.heading)}`,
    subtitle: `mt-2 text-[15px] font-normal ${themeTextClass(c.title)}`,
    contact: `mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] ${themeTextClass(c.title)}`,
    link: `${themeTextClass(c.link)} underline ${themeDecorationClass(c.link)} underline-offset-4 hover:opacity-80`,
    sectionTitle: `mb-5 border-b pb-2 text-[12px] font-semibold uppercase tracking-[0.32em] ${themeBorderClass(c.sectionBar)} ${themeTextClass(c.section)}`,
    body: `text-[14px] leading-[1.85] ${themeTextClass(c.body)}`,
    workCompany: `text-[15px] font-semibold ${themeTextClass(c.heading)}`,
    workPosition: `mt-0.5 text-[13px] ${themeTextClass(c.title)}`,
    workDate: `mb-1 block text-[11px] font-medium uppercase tracking-[0.2em] md:mb-0 md:shrink-0 md:text-right ${themeTextClass(c.muted)}`,
    featuredBadge: `rounded-full border px-2 py-0.5 text-[10px] font-medium ${themeBorderClass(c.bullet)} ${themeTextClass(c.title)}`,
    educationCard: `border-l-2 pl-4 text-[14px] ${themeBorderClass(c.sectionBar)}`,
    educationSchool: `font-semibold ${themeTextClass(c.heading)}`,
    educationMeta: `font-normal ${themeTextClass(c.title)}`,
    bullet: `mt-[9px] h-px w-3 shrink-0 ${themeBgClass(c.bullet)}`,
    timelineRail: `absolute left-[7px] top-3 bottom-0 w-px ${themeBgClass(c.muted)} opacity-40`,
    timelineDot: `absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 bg-white ${themeBorderClass(c.sectionBar)}`,
  }
}

const TIMELINE_TEMPLATE_IDS = [
  'timeline',
  'timeline-blue',
  'timeline-teal',
  'timeline-rose',
] as const

type TimelineTemplateId = (typeof TIMELINE_TEMPLATE_IDS)[number]

const MAGAZINE_BASE: Omit<
  WebResumeTheme,
  | 'id'
  | 'layout'
  | 'header'
  | 'name'
  | 'subtitle'
  | 'contact'
  | 'link'
  | 'workPosition'
  | 'featuredBadge'
  | 'bullet'
> = {
  article: 'mx-auto max-w-[820px] overflow-visible bg-[#faf9f7] shadow-lg ring-1 ring-stone-200',
  sectionTitle: 'text-right text-[11px] font-bold uppercase tracking-[0.3em] text-stone-400',
  sectionTitleMagazine:
    'pt-1 text-right text-[11px] font-bold uppercase tracking-[0.3em] text-stone-400',
  contactLabel: 'text-stone-500',
  contactDot: 'text-stone-600',
  body: 'font-serif text-[14px] leading-[1.9] text-stone-700',
  workBorder:
    'rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md',
  workCompany: 'font-serif text-[16px] font-semibold text-stone-900',
  workDate: 'shrink-0 text-[11px] font-medium uppercase tracking-widest text-stone-400',
  educationCard:
    'rounded-md border border-stone-200 bg-white px-4 py-3 font-serif text-[14px] shadow-sm',
  educationSchool: 'font-semibold text-stone-900',
  educationMeta: 'font-normal italic text-stone-500',
  magazineCard: 'px-8 py-10 md:px-12',
}

const MAGAZINE_ACCENTS: Record<
  'magazine' | 'magazine-midnight' | 'magazine-forest' | 'magazine-wine',
  Pick<
    WebResumeTheme,
    'header' | 'name' | 'subtitle' | 'contact' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'
  >
> = {
  magazine: {
    header:
      'bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 px-8 py-10 text-center md:px-12 md:py-12',
    name: 'font-serif text-[34px] font-normal tracking-wide text-amber-50 md:text-[40px]',
    subtitle: 'mt-2 font-serif text-[16px] italic text-amber-200/80',
    contact:
      'mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-wide text-stone-300',
    link: 'text-amber-300 underline decoration-amber-600/50 underline-offset-2 hover:text-amber-200',
    workPosition: 'mt-1 text-[13px] italic text-amber-800/80',
    featuredBadge:
      'rounded-sm bg-amber-100 px-2 py-0.5 font-serif text-[10px] italic text-amber-900',
    bullet: 'mt-[9px] h-1 w-1 shrink-0 rotate-45 bg-amber-700',
  },
  'magazine-midnight': {
    header:
      'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-8 py-10 text-center md:px-12 md:py-12',
    name: 'font-serif text-[34px] font-normal tracking-wide text-indigo-50 md:text-[40px]',
    subtitle: 'mt-2 font-serif text-[16px] italic text-indigo-200/80',
    contact:
      'mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-wide text-indigo-200/70',
    link: 'text-indigo-300 underline decoration-indigo-500/50 underline-offset-2 hover:text-indigo-200',
    workPosition: 'mt-1 text-[13px] italic text-indigo-800/80',
    featuredBadge:
      'rounded-sm bg-indigo-100 px-2 py-0.5 font-serif text-[10px] italic text-indigo-900',
    bullet: 'mt-[9px] h-1 w-1 shrink-0 rotate-45 bg-indigo-600',
  },
  'magazine-forest': {
    header:
      'bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 px-8 py-10 text-center md:px-12 md:py-12',
    name: 'font-serif text-[34px] font-normal tracking-wide text-emerald-50 md:text-[40px]',
    subtitle: 'mt-2 font-serif text-[16px] italic text-emerald-200/80',
    contact:
      'mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-wide text-emerald-100/70',
    link: 'text-emerald-300 underline decoration-emerald-600/50 underline-offset-2 hover:text-emerald-200',
    workPosition: 'mt-1 text-[13px] italic text-emerald-800/80',
    featuredBadge:
      'rounded-sm bg-emerald-100 px-2 py-0.5 font-serif text-[10px] italic text-emerald-900',
    bullet: 'mt-[9px] h-1 w-1 shrink-0 rotate-45 bg-emerald-700',
  },
  'magazine-wine': {
    header:
      'bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 px-8 py-10 text-center md:px-12 md:py-12',
    name: 'font-serif text-[34px] font-normal tracking-wide text-rose-50 md:text-[40px]',
    subtitle: 'mt-2 font-serif text-[16px] italic text-rose-200/80',
    contact:
      'mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-wide text-rose-100/70',
    link: 'text-rose-300 underline decoration-rose-600/50 underline-offset-2 hover:text-rose-200',
    workPosition: 'mt-1 text-[13px] italic text-rose-800/80',
    featuredBadge:
      'rounded-sm bg-rose-100 px-2 py-0.5 font-serif text-[10px] italic text-rose-900',
    bullet: 'mt-[9px] h-1 w-1 shrink-0 rotate-45 bg-rose-700',
  },
}

function buildSidebarTheme(id: keyof typeof SIDEBAR_ACCENTS): WebResumeTheme {
  return { id, layout: 'sidebar', ...SIDEBAR_BASE, ...SIDEBAR_ACCENTS[id] }
}

function buildTimelineTheme(id: TimelineTemplateId): WebResumeTheme {
  return {
    id,
    layout: 'timeline',
    ...TIMELINE_STRUCTURE,
    ...timelineWebFromDocx(DOCX_RESUME_THEMES[id]),
  }
}

function buildMagazineTheme(id: keyof typeof MAGAZINE_ACCENTS): WebResumeTheme {
  return { id, layout: 'magazine', ...MAGAZINE_BASE, ...MAGAZINE_ACCENTS[id] }
}

export const WEB_RESUME_THEMES: Record<ResumeTemplateId, WebResumeTheme> = {
  default: { id: 'default', layout: 'standard', ...STANDARD_THEMES.default },
  classic: { id: 'classic', layout: 'standard', ...STANDARD_THEMES.classic },
  minimal: { id: 'minimal', layout: 'standard', ...STANDARD_THEMES.minimal },
  elegant: { id: 'elegant', layout: 'standard', ...STANDARD_THEMES.elegant },
  sidebar: buildSidebarTheme('sidebar'),
  'sidebar-navy': buildSidebarTheme('sidebar-navy'),
  'sidebar-forest': buildSidebarTheme('sidebar-forest'),
  'sidebar-wine': buildSidebarTheme('sidebar-wine'),
  timeline: buildTimelineTheme('timeline'),
  'timeline-blue': buildTimelineTheme('timeline-blue'),
  'timeline-teal': buildTimelineTheme('timeline-teal'),
  'timeline-rose': buildTimelineTheme('timeline-rose'),
  magazine: buildMagazineTheme('magazine'),
  'magazine-midnight': buildMagazineTheme('magazine-midnight'),
  'magazine-forest': buildMagazineTheme('magazine-forest'),
  'magazine-wine': buildMagazineTheme('magazine-wine'),
  ...PREMIUM_WEB_THEMES,
}

export function getWebThemeForTemplate(templateId: ResumeTemplateId): WebResumeTheme {
  return WEB_RESUME_THEMES[templateId]
}
