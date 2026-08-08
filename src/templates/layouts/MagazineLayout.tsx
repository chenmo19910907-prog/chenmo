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

export function MagazineResumeLayout({
  resume,
  editable,
  onResumeChange,
}: ResumeContentProps) {
  const theme = useResumeTheme()
  const patchResume = useResumePatch(resume, onResumeChange)

  return (
    <div className="relative w-full overflow-visible">
      <article className={theme.article}>
      <EditableHeader
        resume={resume}
        editable={editable}
        patchResume={patchResume}
        className=""
        bleed={0}
      />
      <div className={theme.magazineCard}>
        <EditableSummary
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          magazine
        />
        <EditableWork
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          layout="magazine"
          magazine
        />
        <EditableEducation
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          magazine
        />
        <EditableSelfEvaluation
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          magazine
        />
      </div>
      </article>
    </div>
  )
}
