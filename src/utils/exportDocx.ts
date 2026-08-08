/**
 * Word 简历导出
 * @see ./resumeExportStandards.ts 版式规范
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopType,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Resume, WorkExperience } from '../types/resume'
import { formatWebsiteDisplayUrl } from './publicSiteUrl'
import { visibleEducations } from './resumeEditText'
import { getWorkDisplayCompany } from './workDisplay'
import { cleanResumeSummary, normalizeDisplayTitle } from './cleanResumeSummary'
import { toReadableResumeText, splitSummaryParagraphs } from './readableResumeText'
import {
  BODY_LINE_SPACING,
  PARAGRAPH_SPACING,
  RESUME_BULLET,
  RESUME_COLOR,
  RESUME_SIZE,
  resumeDocumentStyles,
  resumeRun,
} from './resumeDocxTheme'

/** 右对齐日期/学位用的制表位（A4 默认页边距下内容区右缘） */
const TAB_RIGHT = 9026

type WorkParagraphOptions = {
  spacing?: {
    before?: number
    after?: number
    line?: number
    lineRule?: (typeof BODY_LINE_SPACING)['lineRule']
  }
  indent?: { left?: number; hanging?: number }
  tabStops?: { type: (typeof TabStopType)[keyof typeof TabStopType]; position: number }[]
  children: ReturnType<typeof resumeRun>[]
}

function workParagraph(props: WorkParagraphOptions): Paragraph {
  return new Paragraph({
    spacing: props.spacing,
    tabStops: props.tabStops,
    indent: props.indent,
    children: props.children,
  })
}

function sectionTitle(text: string, options?: { extraBefore?: number }): Paragraph {
  return new Paragraph({
    spacing: {
      before: PARAGRAPH_SPACING.sectionBefore + (options?.extraBefore ?? 0),
      after: PARAGRAPH_SPACING.sectionAfter,
    },
    indent: { left: 180 },
    border: {
      left: {
        style: BorderStyle.SINGLE,
        size: 18,
        color: '2563EB',
        space: 8,
      },
    },
    children: [
      resumeRun({
        text,
        bold: true,
        size: RESUME_SIZE.section,
        color: RESUME_COLOR.section,
        characterSpacing: 0,
      }),
    ],
  })
}

function bodyText(text: string, indent = 0, after: number = PARAGRAPH_SPACING.bodyAfter): Paragraph {
  return new Paragraph({
    spacing: { after, ...BODY_LINE_SPACING },
    indent: indent ? { left: indent } : undefined,
    children: [resumeRun({ text })],
  })
}

function bulletItem(text: string, indent = 280): Paragraph {
  return new Paragraph({
    spacing: { after: PARAGRAPH_SPACING.bulletAfter, ...BODY_LINE_SPACING },
    indent: { left: indent, hanging: 200 },
    children: [
      resumeRun({
        text: `${RESUME_BULLET.char}\t`,
        color: RESUME_BULLET.color,
        size: RESUME_BULLET.size,
        characterSpacing: 0,
      }),
      resumeRun({ text }),
    ],
  })
}

function headerDivider(): Paragraph {
  return new Paragraph({
    spacing: { after: PARAGRAPH_SPACING.headerAfter },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'F1F5F9' },
    },
    children: [resumeRun({ text: '' })],
  })
}

function workExperienceParagraphs(work: WorkExperience, isFirst: boolean): Paragraph[] {
  const company = getWorkDisplayCompany(work)
  const period = `${work.startDate} — ${work.endDate}`
  const paragraphs: Paragraph[] = [
    workParagraph({
      spacing: {
        before: isFirst ? 0 : PARAGRAPH_SPACING.workBefore,
        after: PARAGRAPH_SPACING.workCompanyAfter,
      },
      tabStops: [{ type: TabStopType.RIGHT, position: TAB_RIGHT }],
      children: [
        resumeRun({
          text: company,
          bold: true,
          size: RESUME_SIZE.company,
          color: RESUME_COLOR.heading,
          characterSpacing: 0,
        }),
        resumeRun({
          text: `\t${period}`,
          size: RESUME_SIZE.date,
          color: RESUME_COLOR.muted,
          characterSpacing: 0,
        }),
      ],
    }),
    workParagraph({
      spacing: { after: PARAGRAPH_SPACING.workPositionAfter, ...BODY_LINE_SPACING },
      children: [
        resumeRun({
          text: work.position,
          size: RESUME_SIZE.position,
          color: RESUME_COLOR.title,
          characterSpacing: 0,
        }),
      ],
    }),
  ]

  const roleSummary = work.description?.trim()
  if (roleSummary) {
    paragraphs.push(
      workParagraph({
        spacing: { after: PARAGRAPH_SPACING.workSummaryAfter, ...BODY_LINE_SPACING },
        children: [resumeRun({ text: toReadableResumeText(roleSummary) })],
      }),
    )
  }

  const highlights = work.highlights.slice(0, 5)
  for (const item of highlights) {
    paragraphs.push(
      workParagraph({
        spacing: { after: PARAGRAPH_SPACING.bulletAfter, ...BODY_LINE_SPACING },
        indent: { left: 280, hanging: 200 },
        children: [
          resumeRun({
            text: `${RESUME_BULLET.char}\t`,
            color: RESUME_BULLET.color,
            size: RESUME_BULLET.size,
            characterSpacing: 0,
          }),
          resumeRun({ text: toReadableResumeText(item) }),
        ],
      }),
    )
  }

  return paragraphs
}

function educationParagraph(school: string, major: string | undefined, degree: string | undefined): Paragraph {
  const schoolLine = [school, major, degree?.trim()].filter(Boolean).join(' · ')
  return new Paragraph({
    spacing: { after: 80, ...BODY_LINE_SPACING },
    children: [
      resumeRun({
        text: schoolLine,
        bold: true,
        color: RESUME_COLOR.heading,
        characterSpacing: 0,
      }),
    ],
  })
}

export async function exportToWord(resume: Resume, filename?: string): Promise<void> {
  const { basicInfo } = resume
  const contactParts = [
    basicInfo.phone,
    basicInfo.email,
    basicInfo.location,
    basicInfo.degree,
  ].filter(Boolean)

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        resumeRun({
          text: basicInfo.name,
          bold: true,
          size: RESUME_SIZE.name,
          color: RESUME_COLOR.heading,
          characterSpacing: 0,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        resumeRun({
          text: normalizeDisplayTitle(basicInfo.title),
          size: RESUME_SIZE.title,
          color: RESUME_COLOR.title,
          characterSpacing: 0,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: basicInfo.website ? 120 : 0 },
      children: [
        resumeRun({
          text: contactParts.join('  ·  '),
          size: RESUME_SIZE.contact,
          color: RESUME_COLOR.title,
          characterSpacing: 0,
        }),
      ],
    }),
  ]

  if (basicInfo.website?.trim()) {
    const displayUrl = formatWebsiteDisplayUrl(basicInfo.website)
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, ...BODY_LINE_SPACING },
        children: [
          resumeRun({
            text: '更多项目与作品见个人主页：',
            size: RESUME_SIZE.website,
            color: RESUME_COLOR.title,
            characterSpacing: 0,
          }),
          resumeRun({
            text: displayUrl,
            size: RESUME_SIZE.website,
            color: RESUME_COLOR.link,
            underline: {},
            characterSpacing: 0,
          }),
        ],
      }),
    )
  }

  children.push(headerDivider())

  children.push(sectionTitle('个人简介'))
  const summaryParagraphs = splitSummaryParagraphs(
    toReadableResumeText(cleanResumeSummary(resume.summary)),
  )
  for (const paragraph of summaryParagraphs) {
    children.push(bodyText(paragraph, 0, PARAGRAPH_SPACING.summaryAfter))
  }

  if (resume.workExperiences.length > 0) {
    children.push(sectionTitle('工作经历'))
    resume.workExperiences.forEach((work, index) => {
      children.push(...workExperienceParagraphs(work, index === 0))
    })
  }

  const educations = visibleEducations(resume.educations)
  if (educations.length > 0) {
    children.push(
      sectionTitle('学历', { extraBefore: PARAGRAPH_SPACING.sectionTitleExtraBefore }),
    )
    for (const edu of educations) {
      children.push(educationParagraph(edu.school, edu.major, edu.degree))
    }
  }

  if (resume.selfEvaluation && resume.selfEvaluation.length > 0) {
    children.push(
      sectionTitle('自我评价', { extraBefore: PARAGRAPH_SPACING.sectionTitleExtraBefore }),
    )
    for (const item of resume.selfEvaluation) {
      children.push(bulletItem(toReadableResumeText(item)))
    }
  }

  const doc = new Document({
    styles: resumeDocumentStyles,
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename ?? `${basicInfo.name}-简历.docx`)
}
