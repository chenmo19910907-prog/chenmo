import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isLocalClientAccess } from '../utils/accessMode'

interface AccessModeState {
  isLocal: boolean
  loading: boolean
  publicSiteUrl: string
  refresh: () => Promise<void>
}

const AccessModeContext = createContext<AccessModeState | null>(null)

export function AccessModeProvider({ children }: { children: ReactNode }) {
  const [isLocal, setIsLocal] = useState(isLocalClientAccess())
  const [loading, setLoading] = useState(true)
  const [publicSiteUrl, setPublicSiteUrl] = useState('')

  const refresh = useCallback(async () => {
    const clientLocal = isLocalClientAccess()
    try {
      const res = await fetch('/api/access-mode')
      if (res.ok) {
        const data = (await res.json()) as { isLocal: boolean; publicSiteUrl: string }
        setIsLocal(data.isLocal || clientLocal)
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
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

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
