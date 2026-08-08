export const EXECUTIVE_COLOR_TEMPLATE_IDS = [
  'executive',
  'executive-noir',
  'executive-slate',
  'executive-bronze',
] as const

export const FOLIO_COLOR_TEMPLATE_IDS = [
  'folio',
  'folio-midnight',
  'folio-sage',
  'folio-plum',
] as const

export const LEDGER_COLOR_TEMPLATE_IDS = [
  'ledger',
  'ledger-burgundy',
  'ledger-forest',
  'ledger-graphite',
] as const

export const ATELIER_COLOR_TEMPLATE_IDS = [
  'atelier',
  'atelier-ink',
  'atelier-stone',
  'atelier-moss',
] as const

export const PREMIUM_COLOR_TEMPLATE_IDS = [
  ...EXECUTIVE_COLOR_TEMPLATE_IDS,
  ...FOLIO_COLOR_TEMPLATE_IDS,
  ...LEDGER_COLOR_TEMPLATE_IDS,
  ...ATELIER_COLOR_TEMPLATE_IDS,
] as const
