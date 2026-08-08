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
  hobbies: string[]
  lifeAbout?: string
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

export interface PlatformDemoLinkVariant {
  label: string
  local: PlatformLink
  public: PlatformLink
  /** 仅在本机演示链接中展示，外网/GitHub Pages 不显示 */
  localOnly?: boolean
}

export interface YaahlanPlatform {
  title: string
  summary: string
  demoLinks?: PlatformLink[]
  demoLinkVariants?: PlatformDemoLinkVariant[]
  sections: PlatformSection[]
}
