import { createContext, useContext, useMemo } from 'react'
import { getWebTheme, resolveResumeTemplateId, type ResumeTemplateId } from './index'
import type { WebResumeTheme } from './webThemes'

const ResumeThemeContext = createContext<WebResumeTheme>(getWebTheme('default'))

export function ResumeThemeProvider({
  templateId,
  children,
}: {
  templateId?: ResumeTemplateId
  children: React.ReactNode
}) {
  const theme = useMemo(
    () => getWebTheme(resolveResumeTemplateId(templateId)),
    [templateId],
  )

  return <ResumeThemeContext.Provider value={theme}>{children}</ResumeThemeContext.Provider>
}

export function useResumeTheme() {
  return useContext(ResumeThemeContext)
}
