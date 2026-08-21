import { useResumeTheme } from '../ResumeThemeContext'
import {
  EditableHeader,
  EditableSelfEvaluation,
  EditableSummary,
  EditableWork,
  useResumePatch,
  type ResumeContentProps,
} from './resumeContent'
import {
  parseResumeEducations,
  serializeResumeEducations,
  visibleEducations,
  mergeEducationsPatch,
} from '../../utils/resumeEditText'
import EditableSection from '../../components/EditableSection'
import { EducationListPreview } from './resumeContent'

export function FolioResumeLayout({
  resume,
  editable,
  onResumeChange,
}: ResumeContentProps) {
  const theme = useResumeTheme()
  const patchResume = useResumePatch(resume, onResumeChange)
  const hasEducation =
    resume.educations.length > 0 &&
    (editable || visibleEducations(resume.educations).length > 0)

  return (
    <div className="relative w-full overflow-visible">
      <article className={theme.article}>
        <div className="flex flex-col md:flex-row">
          <aside className={theme.leftRail}>
            <EditableHeader
              resume={resume}
              editable={editable}
              patchResume={patchResume}
              verticalContact
              className=""
              bleed={6}
            />
            {hasEducation && (
              <div className="mt-10 border-t border-stone-200/80 pt-8">
                <h2 className={theme.sectionTitleSidebar}>学历</h2>
                <EditableSection
                  editable={editable}
                  title="编辑学历"
                  buttonPlacement="adjacent"
                  bleed={6}
                  hint="每行：学校 | 专业 | 学历 | 开始 | 结束"
                  getDraft={() => serializeResumeEducations(resume.educations)}
                  onSave={(draft) =>
                    patchResume(
                      mergeEducationsPatch(resume, parseResumeEducations(draft, resume.educations)),
                    )
                  }
                  renderPreview={(draft) => (
                    <EducationListPreview
                      resume={{
                        ...resume,
                        educations: parseResumeEducations(draft, resume.educations),
                      }}
                      compact
                    />
                  )}
                >
                  <EducationListPreview resume={resume} compact />
                </EditableSection>
              </div>
            )}
          </aside>
          <main className={theme.contentPanel}>
            <EditableSummary resume={resume} editable={editable} patchResume={patchResume} />
            <EditableWork
              resume={resume}
              editable={editable}
              patchResume={patchResume}
              layout="folio"
            />
            <EditableSelfEvaluation resume={resume} editable={editable} patchResume={patchResume} />
          </main>
        </div>
      </article>
    </div>
  )
}
