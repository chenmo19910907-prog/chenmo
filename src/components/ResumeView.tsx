import { ResumeThemeProvider, useResumeTheme } from '../templates/ResumeThemeContext'
import { ResumeLayoutRenderer } from '../templates/layouts'
import {
  DEFAULT_RESUME_TEMPLATE_ID,
  resolveResumeTemplateId,
  type ResumeTemplateId,
} from '../templates'
import type { Resume } from '../types/resume'

interface ResumeViewProps {
  resume: Resume
  templateId?: ResumeTemplateId
  editable?: boolean
  onResumeChange?: (resume: Resume) => void
}

function ResumeViewBody({
  resume,
  editable,
  onResumeChange,
}: {
  resume: Resume
  editable: boolean
  onResumeChange?: (resume: Resume) => void
}) {
  const theme = useResumeTheme()

  return (
    <ResumeLayoutRenderer
      layout={theme.layout}
      resume={resume}
      editable={editable}
      onResumeChange={onResumeChange}
    />
  )
}

export default function ResumeView({
  resume,
  templateId = DEFAULT_RESUME_TEMPLATE_ID,
  editable = false,
  onResumeChange,
}: ResumeViewProps) {
  return (
    <ResumeThemeProvider templateId={resolveResumeTemplateId(templateId)}>
      <ResumeViewBody
        resume={resume}
        editable={editable}
        onResumeChange={onResumeChange}
      />
    </ResumeThemeProvider>
  )
}
