import EditableSection from '../../components/EditableSection'
import { useResumeTheme } from '../ResumeThemeContext'
import {
  EditableSelfEvaluation,
  EditableSummary,
  EditableWork,
  EducationListPreview,
  ResumeHeader,
  useResumePatch,
  type ResumeContentProps,
} from './resumeContent'
import {
  parseResumeBasicInfo,
  parseResumeEducations,
  serializeResumeBasicInfo,
  serializeResumeEducations,
  visibleEducations,
  mergeEducationsPatch,
} from '../../utils/resumeEditText'

export function SidebarResumeLayout({
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
      <aside className={theme.sidebar}>
        <EditableSection
          editable={editable}
          title="编辑基本信息"
          bleed={6}
          buttonPlacement="adjacent"
          hint="第一行姓名，第二行职位；下方为联系方式，格式「标签：内容」。"
          getDraft={() => serializeResumeBasicInfo(resume.basicInfo)}
          onSave={(draft) =>
            patchResume({ basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) })
          }
          renderPreview={(draft) => (
            <ResumeHeader
              resume={{ ...resume, basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) }}
              verticalContact
            />
          )}
        >
          <ResumeHeader resume={resume} verticalContact />
        </EditableSection>

        {hasEducation && (
          <div className="mt-10 border-t border-slate-700/80 pt-8">
            <h2 className={theme.sectionTitleSidebar}>学历</h2>
            <EditableSection
              editable={editable}
              title="编辑学历"
              bleed={6}
              buttonPlacement="adjacent"
              hint="每行：学校 | 专业 | 学历 | 开始 | 结束；暂不展示的行首加 *（去掉 * 即恢复显示）"
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

      <div className="min-w-0 flex-1 overflow-visible px-7 py-9 md:px-10 md:py-10">
        <EditableSummary resume={resume} editable={editable} patchResume={patchResume} />
        <EditableWork
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          layout="sidebar"
        />
        <EditableSelfEvaluation resume={resume} editable={editable} patchResume={patchResume} />
      </div>
      </article>
    </div>
  )
}
