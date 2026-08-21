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
import { useAccessMode } from './AccessModeContext'

interface EditModeState {
  /** 当前页面是否支持模块编辑 */
  canEdit: boolean
  /** 是否处于编辑态（导航栏「编辑」已开启） */
  isEditing: boolean
  /** 各模块是否显示「编辑」按钮 */
  moduleEditable: boolean
  toggleEditing: () => void
  exitEditing: () => void
}

const EditModeContext = createContext<EditModeState | null>(null)

function pathSupportsModuleEdit(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/works' || pathname.startsWith('/works/')) return true
  if (pathname.startsWith('/resumes/') && pathname !== '/resumes') return true
  return false
}

export function EditModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isLocal } = useAccessMode()
  const [isEditing, setIsEditing] = useState(false)

  const canEdit = isLocal && pathSupportsModuleEdit(location.pathname)
  const moduleEditable = canEdit && isEditing

  useEffect(() => {
    setIsEditing(false)
  }, [location.pathname])

  const toggleEditing = useCallback(() => {
    setIsEditing((current) => !current)
  }, [])

  const exitEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

  const value = useMemo(
    () => ({
      canEdit,
      isEditing,
      moduleEditable,
      toggleEditing,
      exitEditing,
    }),
    [canEdit, isEditing, moduleEditable, toggleEditing, exitEditing],
  )

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
}

export function useEditMode() {
  const ctx = useContext(EditModeContext)
  if (!ctx) {
    throw new Error('useEditMode must be used within EditModeProvider')
  }
  return ctx
}

/** 模块级「编辑」按钮是否可见 */
export function useModuleEditable(): boolean {
  const { moduleEditable } = useEditMode()
  return moduleEditable
}
