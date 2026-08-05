import type { Resume } from '../types/resume'

interface ResumeEditorProps {
  resume: Resume
  onChange: (resume: Resume) => void
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const className =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          className={`${className} min-h-[80px] resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={className}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[index] = e.target.value
                onChange(next)
              }}
            />
            <button
              type="button"
              className="rounded-lg px-3 text-sm text-red-600 hover:bg-red-50"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              删除
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => onChange([...items, ''])}
        >
          + 添加一项
        </button>
      </div>
    </div>
  )
}

export default function ResumeEditor({ resume, onChange }: ResumeEditorProps) {
  const updateBasic = (field: keyof Resume['basicInfo'], value: string) => {
    onChange({
      ...resume,
      basicInfo: { ...resume.basicInfo, [field]: value },
    })
  }

  const addWork = () => {
    onChange({
      ...resume,
      workExperiences: [
        ...resume.workExperiences,
        {
          id: `work-${Date.now()}`,
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
          highlights: [''],
        },
      ],
    })
  }

  const updateWork = (
    index: number,
    field: keyof Resume['workExperiences'][0],
    value: string | string[],
  ) => {
    const next = [...resume.workExperiences]
    next[index] = { ...next[index], [field]: value }
    onChange({ ...resume, workExperiences: next })
  }

  const removeWork = (index: number) => {
    onChange({
      ...resume,
      workExperiences: resume.workExperiences.filter((_, i) => i !== index),
    })
  }

  const addProject = () => {
    onChange({
      ...resume,
      projectExperiences: [
        ...resume.projectExperiences,
        {
          id: `proj-${Date.now()}`,
          name: '',
          role: '',
          startDate: '',
          endDate: '',
          description: '',
          techStack: [''],
          highlights: [''],
        },
      ],
    })
  }

  const updateProject = (
    index: number,
    field: keyof Resume['projectExperiences'][0],
    value: string | string[],
  ) => {
    const next = [...resume.projectExperiences]
    next[index] = { ...next[index], [field]: value }
    onChange({ ...resume, projectExperiences: next })
  }

  const removeProject = (index: number) => {
    onChange({
      ...resume,
      projectExperiences: resume.projectExperiences.filter((_, i) => i !== index),
    })
  }

  const addEducation = () => {
    onChange({
      ...resume,
      educations: [
        ...resume.educations,
        {
          id: `edu-${Date.now()}`,
          school: '',
          degree: '',
          major: '',
          startDate: '',
          endDate: '',
        },
      ],
    })
  }

  const updateEducation = (
    index: number,
    field: keyof Resume['educations'][0],
    value: string,
  ) => {
    const next = [...resume.educations]
    next[index] = { ...next[index], [field]: value }
    onChange({ ...resume, educations: next })
  }

  const removeEducation = (index: number) => {
    onChange({
      ...resume,
      educations: resume.educations.filter((_, i) => i !== index),
    })
  }

  const addSkillGroup = () => {
    onChange({
      ...resume,
      skillGroups: [
        ...resume.skillGroups,
        { id: `skill-${Date.now()}`, category: '', items: [''] },
      ],
    })
  }

  const updateSkillGroup = (
    index: number,
    field: 'category' | 'items',
    value: string | string[],
  ) => {
    const next = [...resume.skillGroups]
    next[index] = { ...next[index], [field]: value }
    onChange({ ...resume, skillGroups: next })
  }

  const removeSkillGroup = (index: number) => {
    onChange({
      ...resume,
      skillGroups: resume.skillGroups.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-2xl bg-white p-8 shadow-lg">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-blue-800">基本信息</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="姓名" value={resume.basicInfo.name} onChange={(v) => updateBasic('name', v)} />
          <Field label="职位" value={resume.basicInfo.title} onChange={(v) => updateBasic('title', v)} />
          <Field label="电话" value={resume.basicInfo.phone} onChange={(v) => updateBasic('phone', v)} />
          <Field label="邮箱" value={resume.basicInfo.email} onChange={(v) => updateBasic('email', v)} />
          <Field label="地点" value={resume.basicInfo.location} onChange={(v) => updateBasic('location', v)} />
          <Field label="个人网站" value={resume.basicInfo.website ?? ''} onChange={(v) => updateBasic('website', v)} />
          <Field label="GitHub" value={resume.basicInfo.github ?? ''} onChange={(v) => updateBasic('github', v)} />
        </div>
      </section>

      <section>
        <Field
          label="个人简介"
          value={resume.summary}
          onChange={(v) => onChange({ ...resume, summary: v })}
          multiline
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-800">工作经历</h2>
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addWork}>
            + 添加
          </button>
        </div>
        <div className="space-y-6">
          {resume.workExperiences.map((work, index) => (
            <div key={work.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeWork(index)}>
                  删除
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="公司" value={work.company} onChange={(v) => updateWork(index, 'company', v)} />
                <Field label="职位" value={work.position} onChange={(v) => updateWork(index, 'position', v)} />
                <Field label="开始时间" value={work.startDate} onChange={(v) => updateWork(index, 'startDate', v)} />
                <Field label="结束时间" value={work.endDate} onChange={(v) => updateWork(index, 'endDate', v)} />
              </div>
              <div className="mt-4">
                <Field label="工作描述" value={work.description} onChange={(v) => updateWork(index, 'description', v)} multiline />
              </div>
              <div className="mt-4">
                <ListEditor
                  label="工作亮点"
                  items={work.highlights}
                  onChange={(items) => updateWork(index, 'highlights', items.filter(Boolean))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-800">项目经历</h2>
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addProject}>
            + 添加
          </button>
        </div>
        <div className="space-y-6">
          {resume.projectExperiences.map((project, index) => (
            <div key={project.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeProject(index)}>
                  删除
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="项目名称" value={project.name} onChange={(v) => updateProject(index, 'name', v)} />
                <Field label="担任角色" value={project.role} onChange={(v) => updateProject(index, 'role', v)} />
                <Field label="开始时间" value={project.startDate} onChange={(v) => updateProject(index, 'startDate', v)} />
                <Field label="结束时间" value={project.endDate} onChange={(v) => updateProject(index, 'endDate', v)} />
              </div>
              <div className="mt-4">
                <Field label="项目描述" value={project.description} onChange={(v) => updateProject(index, 'description', v)} multiline />
              </div>
              <div className="mt-4">
                <ListEditor
                  label="技术栈"
                  items={project.techStack}
                  onChange={(items) => updateProject(index, 'techStack', items.filter(Boolean))}
                />
              </div>
              <div className="mt-4">
                <ListEditor
                  label="项目亮点"
                  items={project.highlights}
                  onChange={(items) => updateProject(index, 'highlights', items.filter(Boolean))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-800">教育背景</h2>
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addEducation}>
            + 添加
          </button>
        </div>
        <div className="space-y-4">
          {resume.educations.map((edu, index) => (
            <div key={edu.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeEducation(index)}>
                  删除
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="学校" value={edu.school} onChange={(v) => updateEducation(index, 'school', v)} />
                <Field label="学历" value={edu.degree} onChange={(v) => updateEducation(index, 'degree', v)} />
                <Field label="专业" value={edu.major} onChange={(v) => updateEducation(index, 'major', v)} />
                <Field label="开始时间" value={edu.startDate} onChange={(v) => updateEducation(index, 'startDate', v)} />
                <Field label="结束时间" value={edu.endDate} onChange={(v) => updateEducation(index, 'endDate', v)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-800">专业技能</h2>
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addSkillGroup}>
            + 添加
          </button>
        </div>
        <div className="space-y-4">
          {resume.skillGroups.map((group, index) => (
            <div key={group.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeSkillGroup(index)}>
                  删除
                </button>
              </div>
              <Field
                label="分类名称"
                value={group.category}
                onChange={(v) => updateSkillGroup(index, 'category', v)}
              />
              <div className="mt-4">
                <ListEditor
                  label="技能项"
                  items={group.items}
                  onChange={(items) => updateSkillGroup(index, 'items', items.filter(Boolean))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <ListEditor
          label="自我评价"
          items={resume.selfEvaluation ?? []}
          onChange={(items) =>
            onChange({ ...resume, selfEvaluation: items.filter(Boolean) })
          }
        />
      </section>
    </div>
  )
}
