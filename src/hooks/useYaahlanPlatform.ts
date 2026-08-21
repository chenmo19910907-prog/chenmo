import { useMemo } from 'react'
import { useAccessMode } from '../context/AccessModeContext'
import type { YaahlanPlatform } from '../types/profile'
import { resolveYaahlanPlatform } from '../utils/yaahlanDemoLinks'

export function useYaahlanPlatform(): YaahlanPlatform {
  const { isLocal } = useAccessMode()
  return useMemo(() => resolveYaahlanPlatform(isLocal), [isLocal])
}
