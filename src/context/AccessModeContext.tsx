import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import {
  isLocalClientAccess,
  isLocalHostname,
  isPublicPreviewMode,
  syncPublicPreviewFromUrl,
} from '../utils/accessMode'

interface AccessModeState {
  isLocal: boolean
  loading: boolean
  publicSiteUrl: string
  refresh: () => Promise<void>
}

const AccessModeContext = createContext<AccessModeState | null>(null)

export function AccessModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [isLocal, setIsLocal] = useState(isLocalClientAccess())
  const [loading, setLoading] = useState(true)
  const [publicSiteUrl, setPublicSiteUrl] = useState('')

  const refresh = useCallback(async () => {
    syncPublicPreviewFromUrl(location.search)
    const preview = isPublicPreviewMode()
    const onLocalHost = typeof window !== 'undefined' && isLocalHostname(window.location.hostname)
    const clientLocal = onLocalHost && !preview
    try {
      const res = await fetch('/api/access-mode')
      if (res.ok) {
        const data = (await res.json()) as { isLocal: boolean; publicSiteUrl: string }
        setIsLocal((data.isLocal || onLocalHost) && !preview)
        setPublicSiteUrl(data.publicSiteUrl)
        return
      }
    } catch {
      /* API 不可用时仅依赖客户端判断 */
    }
    setIsLocal(clientLocal)
    setPublicSiteUrl(
      clientLocal ? '' : `${window.location.protocol}//${window.location.host}`,
    )
  }, [location.search])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh, location.pathname])

  const value = useMemo(
    () => ({ isLocal, loading, publicSiteUrl, refresh }),
    [isLocal, loading, publicSiteUrl, refresh],
  )

  return (
    <AccessModeContext.Provider value={value}>{children}</AccessModeContext.Provider>
  )
}

export function useAccessMode() {
  const ctx = useContext(AccessModeContext)
  if (!ctx) {
    throw new Error('useAccessMode must be used within AccessModeProvider')
  }
  return ctx
}
