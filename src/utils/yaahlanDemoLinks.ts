import platformData from '../data/yaahlan-platform.json'
import type { PlatformLink, YaahlanPlatform } from '../types/profile'

const platform = platformData as YaahlanPlatform

/** 不在简历中展示的演示链接（本机与外网均隐藏，JSON localOnly 会被打包器裁掉） */
const HIDDEN_DEMO_LABELS = new Set([
  '用 Cursor 搭建智能工具平台',
  'PK 提款机：从零到 MOA 与自动化',
])

export function resolvePlatformDemoLinks(useLocal: boolean): PlatformLink[] {
  if (platform.demoLinkVariants?.length) {
    return platform.demoLinkVariants
      .filter((item) => !HIDDEN_DEMO_LABELS.has(item.label))
      .map((item) => {
      const picked = useLocal ? item.local : item.public
      return {
        label: item.label,
        url: picked.url,
        description: picked.description,
      } satisfies PlatformLink
    })
  }
  return platform.demoLinks ?? []
}

export function resolveYaahlanPlatform(useLocal: boolean): YaahlanPlatform {
  const links = resolvePlatformDemoLinks(useLocal)
  return {
    ...platform,
    demoLinks: links,
    sections: platform.sections.map((section) =>
      section.title === '相关链接'
        ? {
            ...section,
            content: useLocal
              ? '以下链接在本机 Web Agent 服务运行时可用（默认端口 18766）。'
              : '以下链接为 GitHub Pages 在线演示，完整 MOA / Tunnel 能力需内网服务。',
            links,
          }
        : section,
    ),
  }
}
