export interface ProfileContact {
  phone?: string
  email?: string
  location?: string
  degree?: string
}

export interface ProfileHighlight {
  title: string
  description: string
}

export interface PersonalProfile {
  name: string
  title: string
  tagline: string
  about: string[]
  highlights: ProfileHighlight[]
  contact: ProfileContact
}

export interface PlatformLink {
  label: string
  url: string
  description?: string
}

export interface PlatformSection {
  title: string
  content: string
  links?: PlatformLink[]
  bullets?: string[]
}

export interface YaahlanPlatform {
  title: string
  summary: string
  sections: PlatformSection[]
}
