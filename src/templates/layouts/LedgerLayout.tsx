import { useResumeTheme } from '../ResumeThemeContext'
import {
  EditableEducation,
  EditableHeader,
  EditableSelfEvaluation,
  EditableSummary,
  EditableWork,
  useResumePatch,
  type ResumeContentProps,
} from './resumeContent'

export function LedgerResumeLayout({
  resume,
  editable,
  onResumeChange,
}: ResumeContentProps) {
  const theme = useResumeTheme()
  const patchResume = useResumePatch(resume, onResumeChange)

  return (
    <div className="relative w-full overflow-visible">
      <article className={theme.article}>
        <EditableHeader resume={resume} editable={editable} patchResume={patchResume} bleed={0} />
        <div className={theme.magazineCard}>
          <EditableSummary resume={resume} editable={editable} patchResume={patchResume} ledger />
          <EditableWork
            resume={resume}
            editable={editable}
            patchResume={patchResume}
            layout="ledger"
            ledger
          />
          <EditableEducation
            resume={resume}
            editable={editable}
            patchResume={patchResume}
            ledger
          />
          <EditableSelfEvaluation
            resume={resume}
            editable={editable}
            patchResume={patchResume}
            ledger
          />
        </div>
      </article>
    </div>
  )
}
