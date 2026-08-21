import type { ResumeLayoutId, ResumeTemplateId } from './types'
import { PREMIUM_DOCX_THEMES } from './premiumDocxThemes'

export interface DocxResumeTheme {
  layout: ResumeLayoutId
  heading: string
  title: string
  body: string
  muted: string
  section: string
  link: string
  sectionBar: string
  headerDivider: string
  bullet: string
}

const STANDARD_DOCX: Record<
  'default' | 'classic' | 'minimal' | 'elegant',
  DocxResumeTheme
> = {
  default: {
    layout: 'standard',
    heading: '0F172A',
    title: '64748B',
    body: '475569',
    muted: '94A3B8',
    section: '1E293B',
    link: '2563EB',
    sectionBar: '2563EB',
    headerDivider: 'F1F5F9',
    bullet: '3B82F6',
  },
  classic: {
    layout: 'standard',
    heading: '0A0A0A',
    title: '525252',
    body: '404040',
    muted: '737373',
    section: '171717',
    link: '171717',
    sectionBar: '171717',
    headerDivider: 'D4D4D4',
    bullet: '404040',
  },
  minimal: {
    layout: 'standard',
    heading: '334155',
    title: '64748B',
    body: '64748B',
    muted: '94A3B8',
    section: '94A3B8',
    link: '475569',
    sectionBar: 'CBD5E1',
    headerDivider: 'E2E8F0',
    bullet: '94A3B8',
  },
  elegant: {
    layout: 'standard',
    heading: '312E81',
    title: '6366F1',
    body: '475569',
    muted: 'A5B4FC',
    section: '3730A3',
    link: '4F46E5',
    sectionBar: '4F46E5',
    headerDivider: 'E0E7FF',
    bullet: '6366F1',
  },
}

const SIDEBAR_DOCX: Record<
  'sidebar' | 'sidebar-navy' | 'sidebar-forest' | 'sidebar-wine',
  DocxResumeTheme
> = {
  sidebar: {
    layout: 'sidebar',
    heading: '0F172A',
    title: 'B45309',
    body: '404040',
    muted: '737373',
    section: '64748B',
    link: 'B45309',
    sectionBar: '1E293B',
    headerDivider: 'E5E7EB',
    bullet: 'D97706',
  },
  'sidebar-navy': {
    layout: 'sidebar',
    heading: '0F172A',
    title: '0284C7',
    body: '404040',
    muted: '737373',
    section: '64748B',
    link: '0284C7',
    sectionBar: '172554',
    headerDivider: 'E5E7EB',
    bullet: '0EA5E9',
  },
  'sidebar-forest': {
    layout: 'sidebar',
    heading: '0F172A',
    title: '059669',
    body: '404040',
    muted: '737373',
    section: '64748B',
    link: '059669',
    sectionBar: '064E3B',
    headerDivider: 'E5E7EB',
    bullet: '10B981',
  },
  'sidebar-wine': {
    layout: 'sidebar',
    heading: '0F172A',
    title: 'E11D48',
    body: '404040',
    muted: '737373',
    section: '64748B',
    link: 'E11D48',
    sectionBar: '4C0519',
    headerDivider: 'E5E7EB',
    bullet: 'F43F5E',
  },
}

const TIMELINE_DOCX: Record<
  'timeline' | 'timeline-blue' | 'timeline-teal' | 'timeline-rose',
  DocxResumeTheme
> = {
  timeline: {
    layout: 'timeline',
    heading: '0F172A',
    title: '64748B',
    body: '475569',
    muted: '94A3B8',
    section: '64748B',
    link: '334155',
    sectionBar: '0F172A',
    headerDivider: '0F172A',
    bullet: '64748B',
  },
  'timeline-blue': {
    layout: 'timeline',
    heading: '1E3A8A',
    title: '3B82F6',
    body: '475569',
    muted: '93C5FD',
    section: '3B82F6',
    link: '1D4ED8',
    sectionBar: '1D4ED8',
    headerDivider: '1D4ED8',
    bullet: '3B82F6',
  },
  'timeline-teal': {
    layout: 'timeline',
    heading: '115E59',
    title: '14B8A6',
    body: '475569',
    muted: '5EEAD4',
    section: '14B8A6',
    link: '0F766E',
    sectionBar: '0F766E',
    headerDivider: '0F766E',
    bullet: '14B8A6',
  },
  'timeline-rose': {
    layout: 'timeline',
    heading: '9F1239',
    title: 'FB7185',
    body: '475569',
    muted: 'FDA4AF',
    section: 'FB7185',
    link: 'BE123C',
    sectionBar: 'BE123C',
    headerDivider: 'BE123C',
    bullet: 'FB7185',
  },
}

const MAGAZINE_DOCX: Record<
  'magazine' | 'magazine-midnight' | 'magazine-forest' | 'magazine-wine',
  DocxResumeTheme
> = {
  magazine: {
    layout: 'magazine',
    heading: '292524',
    title: '92400E',
    body: '57534E',
    muted: 'A8A29E',
    section: '78716C',
    link: 'B45309',
    sectionBar: 'D6D3D1',
    headerDivider: 'E7E5E4',
    bullet: 'B45309',
  },
  'magazine-midnight': {
    layout: 'magazine',
    heading: '1E1B4B',
    title: '6366F1',
    body: '57534E',
    muted: 'A8A29E',
    section: '6366F1',
    link: '4F46E5',
    sectionBar: 'C7D2FE',
    headerDivider: 'E0E7FF',
    bullet: '6366F1',
  },
  'magazine-forest': {
    layout: 'magazine',
    heading: '064E3B',
    title: '059669',
    body: '57534E',
    muted: 'A8A29E',
    section: '059669',
    link: '047857',
    sectionBar: 'A7F3D0',
    headerDivider: 'D1FAE5',
    bullet: '059669',
  },
  'magazine-wine': {
    layout: 'magazine',
    heading: '881337',
    title: 'E11D48',
    body: '57534E',
    muted: 'A8A29E',
    section: 'E11D48',
    link: 'BE123C',
    sectionBar: 'FECDD3',
    headerDivider: 'FFE4E6',
    bullet: 'E11D48',
  },
}

export const DOCX_RESUME_THEMES: Record<ResumeTemplateId, DocxResumeTheme> = {
  ...STANDARD_DOCX,
  ...SIDEBAR_DOCX,
  ...TIMELINE_DOCX,
  ...MAGAZINE_DOCX,
  ...PREMIUM_DOCX_THEMES,
}
