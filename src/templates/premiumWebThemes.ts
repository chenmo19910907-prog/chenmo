import type { ResumeTemplateId } from './types'
import type { WebResumeTheme } from './webThemes'

type ThemeTokens = Omit<WebResumeTheme, 'id' | 'layout'>

const EXECUTIVE_BASE: Omit<
  ThemeTokens,
  'link' | 'workPosition' | 'featuredBadge' | 'bullet'
> = {
  article:
    'mx-auto max-w-[760px] overflow-visible bg-[#faf8f5] px-10 py-12 shadow-xl ring-1 ring-stone-200/50 md:px-14 md:py-14',
  sectionTitle:
    'shrink-0 text-[10px] font-medium uppercase tracking-[0.42em] text-stone-500',
  header:
    'border-y border-stone-300/60 py-8 text-center md:py-10',
  name: 'font-serif text-[34px] font-light tracking-[0.12em] text-stone-900 md:text-[38px]',
  subtitle: 'mt-3 text-[12px] font-medium uppercase tracking-[0.38em] text-stone-500',
  contact:
    'mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-wide text-stone-500',
  contactLabel: 'text-stone-400',
  contactDot: 'text-stone-300',
  body: 'text-[14px] leading-[1.95] text-stone-600',
  workBorder: 'border-b border-stone-200/80 pb-7 last:border-0 last:pb-0',
  workCompany: 'font-serif text-[16px] font-medium tracking-wide text-stone-900',
  workDate: 'shrink-0 text-[11px] tabular-nums tracking-widest text-stone-400',
  educationCard: 'text-[13px] text-stone-600',
  educationSchool: 'font-serif font-medium text-stone-800',
  educationMeta: 'font-normal text-stone-500',
}

const EXECUTIVE_ACCENTS: Record<
  'executive' | 'executive-noir' | 'executive-slate' | 'executive-bronze',
  Pick<WebResumeTheme, 'link' | 'workPosition' | 'featuredBadge' | 'bullet'>
> = {
  executive: {
    link: 'text-amber-800 underline decoration-amber-300/60 underline-offset-4',
    workPosition: 'mt-1 text-[12px] uppercase tracking-[0.22em] text-stone-500',
    featuredBadge: 'rounded-sm border border-amber-300/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-amber-900',
    bullet: 'mt-[9px] h-px w-4 shrink-0 bg-amber-700/70',
  },
  'executive-noir': {
    link: 'text-stone-900 underline decoration-stone-400 underline-offset-4',
    workPosition: 'mt-1 text-[12px] uppercase tracking-[0.22em] text-stone-500',
    featuredBadge: 'rounded-sm border border-stone-400 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-stone-800',
    bullet: 'mt-[9px] h-px w-4 shrink-0 bg-stone-800',
  },
  'executive-slate': {
    link: 'text-slate-700 underline decoration-slate-300 underline-offset-4',
    workPosition: 'mt-1 text-[12px] uppercase tracking-[0.22em] text-slate-500',
    featuredBadge: 'rounded-sm border border-slate-300 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-slate-700',
    bullet: 'mt-[9px] h-px w-4 shrink-0 bg-slate-500',
  },
  'executive-bronze': {
    link: 'text-amber-900 underline decoration-amber-600/40 underline-offset-4',
    workPosition: 'mt-1 text-[12px] uppercase tracking-[0.22em] text-amber-900/70',
    featuredBadge: 'rounded-sm border border-amber-700/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-amber-950',
    bullet: 'mt-[9px] h-px w-4 shrink-0 bg-amber-800/80',
  },
}

const FOLIO_BASE: Omit<
  ThemeTokens,
  'sidebar' | 'leftRail' | 'contentPanel' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'
> = {
  article:
    'mx-auto flex max-w-[920px] overflow-visible rounded-sm bg-white shadow-2xl ring-1 ring-stone-200/80',
  sectionTitle:
    'mb-4 text-[10px] font-semibold uppercase tracking-[0.36em] text-stone-400',
  sectionTitleSidebar:
    'mb-3 text-[9px] font-bold uppercase tracking-[0.32em] text-stone-400',
  header: 'text-left',
  name: 'font-serif text-[32px] font-light leading-tight tracking-tight text-stone-900',
  subtitle: 'mt-2 text-[13px] font-medium tracking-wide text-stone-500',
  contact: 'mt-6 space-y-2 text-[12px] text-stone-600',
  contactLabel: 'text-stone-400',
  contactDot: 'hidden',
  body: 'text-[14px] leading-[1.9] text-stone-600',
  workBorder: 'border-l border-stone-200 pl-5',
  workCompany: 'text-[15px] font-semibold tracking-tight text-stone-900',
  workDate: 'text-[11px] font-medium uppercase tracking-widest text-stone-400',
  educationCard: 'text-[12px] leading-relaxed text-stone-600',
  educationSchool: 'font-medium text-stone-800',
  educationMeta: 'text-stone-500',
  sidebarMuted: 'text-stone-400',
}

const FOLIO_ACCENTS: Record<
  'folio' | 'folio-midnight' | 'folio-sage' | 'folio-plum',
  Pick<
    WebResumeTheme,
    'leftRail' | 'contentPanel' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'
  >
> = {
  folio: {
    leftRail: 'w-[32%] shrink-0 bg-stone-50 px-8 py-10 md:px-10 md:py-12',
    contentPanel: 'min-w-0 flex-1 px-8 py-10 md:px-10 md:py-12',
    link: 'text-stone-700 underline decoration-stone-300 underline-offset-2',
    workPosition: 'mt-0.5 text-[13px] text-stone-500',
    featuredBadge: 'bg-stone-100 text-stone-700',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rounded-full bg-stone-400',
  },
  'folio-midnight': {
    leftRail: 'w-[32%] shrink-0 bg-slate-950 px-8 py-10 text-stone-200 md:px-10 md:py-12',
    contentPanel: 'min-w-0 flex-1 bg-white px-8 py-10 md:px-10 md:py-12',
    link: 'text-indigo-700 underline decoration-indigo-200 underline-offset-2',
    workPosition: 'mt-0.5 text-[13px] text-indigo-700/70',
    featuredBadge: 'bg-indigo-50 text-indigo-800',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rounded-full bg-indigo-500',
  },
  'folio-sage': {
    leftRail: 'w-[32%] shrink-0 bg-[#f4f6f2] px-8 py-10 md:px-10 md:py-12',
    contentPanel: 'min-w-0 flex-1 px-8 py-10 md:px-10 md:py-12',
    link: 'text-emerald-800 underline decoration-emerald-200 underline-offset-2',
    workPosition: 'mt-0.5 text-[13px] text-emerald-700/80',
    featuredBadge: 'bg-emerald-50 text-emerald-800',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rounded-full bg-emerald-600',
  },
  'folio-plum': {
    leftRail: 'w-[32%] shrink-0 bg-[#f8f5f9] px-8 py-10 md:px-10 md:py-12',
    contentPanel: 'min-w-0 flex-1 px-8 py-10 md:px-10 md:py-12',
    link: 'text-violet-800 underline decoration-violet-200 underline-offset-2',
    workPosition: 'mt-0.5 text-[13px] text-violet-700/80',
    featuredBadge: 'bg-violet-50 text-violet-800',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rounded-full bg-violet-500',
  },
}

const LEDGER_BASE: Omit<
  ThemeTokens,
  'link' | 'workPosition' | 'featuredBadge' | 'bullet' | 'header'
> = {
  article: 'mx-auto max-w-[820px] overflow-visible bg-white shadow-xl ring-1 ring-slate-200/70',
  sectionTitle:
    'pt-0.5 text-right text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400',
  sectionTitleMagazine:
    'pt-0.5 text-right text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400',
  name: 'font-serif text-[36px] font-normal tracking-wide text-white md:text-[40px]',
  subtitle: 'mt-2 text-[14px] tracking-wide text-slate-300',
  contact: 'mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-400',
  contactLabel: 'text-slate-500',
  contactDot: 'text-slate-600',
  body: 'text-[14px] leading-[1.85] text-slate-600',
  workBorder: 'rounded-md border border-slate-200/90 bg-slate-50/40 p-5',
  workCompany: 'font-serif text-[16px] font-semibold text-slate-900',
  workDate: 'text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400',
  educationCard:
    'rounded border border-slate-200 bg-white px-3 py-2 text-[13px] shadow-sm',
  educationSchool: 'font-semibold text-slate-900',
  educationMeta: 'text-slate-500',
  magazineCard: 'px-10 py-10 md:px-12 md:py-12',
}

const LEDGER_ACCENTS: Record<
  'ledger' | 'ledger-burgundy' | 'ledger-forest' | 'ledger-graphite',
  Pick<WebResumeTheme, 'header' | 'link' | 'workPosition' | 'featuredBadge' | 'bullet'>
> = {
  ledger: {
    header: 'bg-slate-900 px-10 py-10 text-left md:px-12 md:py-12',
    link: 'text-sky-300 underline decoration-sky-500/40 underline-offset-2',
    workPosition: 'mt-1 text-[13px] text-sky-800/80',
    featuredBadge: 'bg-sky-100 text-sky-900',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rotate-45 bg-sky-700',
  },
  'ledger-burgundy': {
    header: 'bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 px-10 py-10 md:px-12 md:py-12',
    link: 'text-rose-200 underline decoration-rose-400/40 underline-offset-2',
    workPosition: 'mt-1 text-[13px] text-rose-800/80',
    featuredBadge: 'bg-rose-100 text-rose-900',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rotate-45 bg-rose-700',
  },
  'ledger-forest': {
    header: 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 px-10 py-10 md:px-12 md:py-12',
    link: 'text-emerald-200 underline decoration-emerald-400/40 underline-offset-2',
    workPosition: 'mt-1 text-[13px] text-emerald-800/80',
    featuredBadge: 'bg-emerald-100 text-emerald-900',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rotate-45 bg-emerald-700',
  },
  'ledger-graphite': {
    header: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-stone-800 px-10 py-10 md:px-12 md:py-12',
    link: 'text-zinc-300 underline decoration-zinc-500/40 underline-offset-2',
    workPosition: 'mt-1 text-[13px] text-zinc-700',
    featuredBadge: 'bg-zinc-200 text-zinc-800',
    bullet: 'mt-[8px] h-1 w-1 shrink-0 rotate-45 bg-zinc-600',
  },
}

const ATELIER_BASE: Omit<
  ThemeTokens,
  'link' | 'workPosition' | 'featuredBadge' | 'bullet' | 'header'
> = {
  article:
    'mx-auto max-w-[740px] overflow-visible border border-stone-200 bg-white px-12 py-14 md:px-16 md:py-16',
  sectionTitle:
    'mb-5 text-[9px] font-medium uppercase tracking-[0.48em] text-stone-400',
  name: 'text-[30px] font-extralight tracking-[0.2em] text-stone-900 md:text-[34px]',
  subtitle: 'mt-3 text-[12px] font-light tracking-[0.3em] text-stone-500',
  contact: 'mt-5 space-y-1 text-[12px] font-light text-stone-500',
  contactLabel: 'sr-only',
  contactDot: 'hidden',
  body: 'text-[14px] font-light leading-[2] text-stone-600',
  workBorder: 'border-b border-stone-100 py-6 last:border-0',
  workCompany: 'text-[14px] font-medium tracking-[0.08em] text-stone-900',
  workDate: 'text-[10px] font-light tracking-[0.28em] text-stone-400',
  educationCard: 'text-[13px] font-light text-stone-600',
  educationSchool: 'font-medium text-stone-800',
  educationMeta: 'text-stone-500',
}

const ATELIER_ACCENTS: Record<
  'atelier' | 'atelier-ink' | 'atelier-stone' | 'atelier-moss',
  Pick<WebResumeTheme, 'link' | 'workPosition' | 'featuredBadge' | 'bullet' | 'header'>
> = {
  atelier: {
    header: 'border-b border-stone-200 pb-8 text-left',
    link: 'text-stone-700 underline decoration-stone-300 underline-offset-4',
    workPosition: 'mt-1 text-[12px] font-light tracking-widest text-stone-500',
    featuredBadge:
      'border border-stone-200 px-1.5 py-0.5 text-[9px] font-light tracking-[0.2em] text-stone-600',
    bullet: 'mt-[10px] h-px w-2 shrink-0 bg-stone-300',
  },
  'atelier-ink': {
    header: 'border-b border-stone-800 pb-8 text-left',
    link: 'text-stone-900 underline decoration-stone-400 underline-offset-4',
    workPosition: 'mt-1 text-[12px] font-light tracking-widest text-stone-600',
    featuredBadge:
      'border border-stone-800 px-1.5 py-0.5 text-[9px] font-light tracking-[0.2em] text-stone-800',
    bullet: 'mt-[10px] h-px w-2 shrink-0 bg-stone-800',
  },
  'atelier-stone': {
    header: 'border-b border-amber-200/80 pb-8 text-left',
    link: 'text-amber-900 underline decoration-amber-300 underline-offset-4',
    workPosition: 'mt-1 text-[12px] font-light tracking-widest text-amber-800/80',
    featuredBadge:
      'border border-amber-200 px-1.5 py-0.5 text-[9px] font-light tracking-[0.2em] text-amber-800',
    bullet: 'mt-[10px] h-px w-2 shrink-0 bg-amber-400',
  },
  'atelier-moss': {
    header: 'border-b border-emerald-200/80 pb-8 text-left',
    link: 'text-emerald-900 underline decoration-emerald-300 underline-offset-4',
    workPosition: 'mt-1 text-[12px] font-light tracking-widest text-emerald-800/80',
    featuredBadge:
      'border border-emerald-200 px-1.5 py-0.5 text-[9px] font-light tracking-[0.2em] text-emerald-800',
    bullet: 'mt-[10px] h-px w-2 shrink-0 bg-emerald-500',
  },
}

function buildExecutive(id: keyof typeof EXECUTIVE_ACCENTS): WebResumeTheme {
  return { id, layout: 'executive', ...EXECUTIVE_BASE, ...EXECUTIVE_ACCENTS[id] }
}

function buildFolio(id: keyof typeof FOLIO_ACCENTS): WebResumeTheme {
  const theme: WebResumeTheme = { id, layout: 'folio', ...FOLIO_BASE, ...FOLIO_ACCENTS[id] }
  if (id === 'folio-midnight') {
    return {
      ...theme,
      name: 'font-serif text-[32px] font-light leading-tight tracking-tight text-white',
      subtitle: 'mt-2 text-[13px] font-medium tracking-wide text-slate-300',
      contact: 'mt-6 space-y-2 text-[12px] text-slate-300',
      educationSchool: 'font-medium text-slate-100',
      educationMeta: 'text-slate-400',
    }
  }
  return theme
}

function buildLedger(id: keyof typeof LEDGER_ACCENTS): WebResumeTheme {
  return { id, layout: 'ledger', ...LEDGER_BASE, ...LEDGER_ACCENTS[id] }
}

function buildAtelier(id: keyof typeof ATELIER_ACCENTS): WebResumeTheme {
  return { id, layout: 'atelier', ...ATELIER_BASE, ...ATELIER_ACCENTS[id] }
}

export const PREMIUM_WEB_THEMES: Record<
  | 'executive'
  | 'executive-noir'
  | 'executive-slate'
  | 'executive-bronze'
  | 'folio'
  | 'folio-midnight'
  | 'folio-sage'
  | 'folio-plum'
  | 'ledger'
  | 'ledger-burgundy'
  | 'ledger-forest'
  | 'ledger-graphite'
  | 'atelier'
  | 'atelier-ink'
  | 'atelier-stone'
  | 'atelier-moss',
  WebResumeTheme
> = {
  executive: buildExecutive('executive'),
  'executive-noir': buildExecutive('executive-noir'),
  'executive-slate': buildExecutive('executive-slate'),
  'executive-bronze': buildExecutive('executive-bronze'),
  folio: buildFolio('folio'),
  'folio-midnight': buildFolio('folio-midnight'),
  'folio-sage': buildFolio('folio-sage'),
  'folio-plum': buildFolio('folio-plum'),
  ledger: buildLedger('ledger'),
  'ledger-burgundy': buildLedger('ledger-burgundy'),
  'ledger-forest': buildLedger('ledger-forest'),
  'ledger-graphite': buildLedger('ledger-graphite'),
  atelier: buildAtelier('atelier'),
  'atelier-ink': buildAtelier('atelier-ink'),
  'atelier-stone': buildAtelier('atelier-stone'),
  'atelier-moss': buildAtelier('atelier-moss'),
}

export type PremiumWebTemplateId = keyof typeof PREMIUM_WEB_THEMES

export function isPremiumWebTemplateId(id: ResumeTemplateId): id is PremiumWebTemplateId {
  return id in PREMIUM_WEB_THEMES
}
