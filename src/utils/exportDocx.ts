/**
 * Word 简历导出
 * @see ./resumeExportStandards.ts 版式规范
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  VerticalAlignTable,
  WidthType,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Resume, WorkExperience, Education } from '../types/resume'
import {
  DEFAULT_RESUME_TEMPLATE_ID,
  getDocxTheme,
  resolveResumeTemplateId,
  type ResumeTemplateId,
} from '../templates'
import type { DocxResumeTheme } from '../templates/docxThemes'
import { formatWebsiteDisplayUrl } from './publicSiteUrl'
import { visibleEducations, getResumeContactItems } from './resumeEditText'
import { getWorkDisplayCompany } from './workDisplay'
import { cleanResumeSummary, normalizeDisplayTitle } from './cleanResumeSummary'
import { toReadableResumeText, splitSummaryParagraphs } from './readableResumeText'
import {
  BODY_LINE_SPACING,
  PARAGRAPH_SPACING,
  RESUME_BULLET,
  RESUME_SIZE,
  createResumeDocumentStyles,
  resumeRun,
} from './resumeDocxTheme'
import { RESUME_WEBSITE_CTA } from './resumeExportStandards'
import {
  getDocxAvatarSize,
  loadResumeAvatarForDocx,
  type ResumeAvatarDocxData,
} from './resumeAvatar'

/** 右对齐日期/学位用的制表位（A4 默认页边距下内容区右缘） */
const TAB_RIGHT = 9026

/** timeline 头像列宽（72px 头像 + gap-5 间距，单位 DXA） */
const TIMELINE_AVATAR_COL_DXA = 1080 + 300

const BORDERLESS_TABLE_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const

function getDocxAvatarAlignment(
  layout: DocxResumeTheme['layout'],
): (typeof AlignmentType)[keyof typeof AlignmentType] {
  return layout === 'standard' ||
    layout === 'magazine' ||
    layout === 'executive' ||
    layout === 'ledger'
    ? AlignmentType.CENTER
    : AlignmentType.LEFT
}

export interface ExportToWordOptions {
  filename?: string
  templateId?: ResumeTemplateId
}

type DocxAvatarOptions = {
  image: ResumeAvatarDocxData
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType]
}

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

function createDocxBuilders(theme: DocxResumeTheme) {
  const workParagraph = (props: WorkParagraphOptions): Paragraph =>
    new Paragraph({
      spacing: props.spacing,
      tabStops: props.tabStops,
      indent: props.indent,
      children: props.children,
    })

  const headerAlignment =
    theme.layout === 'standard' ||
    theme.layout === 'magazine' ||
    theme.layout === 'executive' ||
    theme.layout === 'ledger'
      ? AlignmentType.CENTER
      : AlignmentType.LEFT

  const sectionTitle = (text: string, options?: { extraBefore?: number }): Paragraph => {
    const before = PARAGRAPH_SPACING.sectionBefore + (options?.extraBefore ?? 0)

    if (theme.layout === 'timeline') {
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before, after: PARAGRAPH_SPACING.sectionAfter },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: theme.sectionBar,
            space: 4,
          },
        },
        children: [
          resumeRun({
            text: text.toUpperCase(),
            bold: true,
            size: RESUME_SIZE.section,
            color: theme.section,
            characterSpacing: 40,
          }),
        ],
      })
    }

    if (theme.layout === 'executive') {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before, after: PARAGRAPH_SPACING.sectionAfter },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 4,
            color: theme.sectionBar,
            space: 4,
          },
        },
        children: [
          resumeRun({
            text: text.toUpperCase(),
            size: RESUME_SIZE.section,
            color: theme.section,
            characterSpacing: 80,
          }),
        ],
      })
    }

    if (theme.layout === 'magazine' || theme.layout === 'ledger') {
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before, after: PARAGRAPH_SPACING.sectionAfter },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: theme.sectionBar,
            space: 6,
          },
        },
        children: [
          resumeRun({
            text: text.toUpperCase(),
            bold: true,
            size: RESUME_SIZE.section,
            color: theme.section,
            characterSpacing: 60,
          }),
        ],
      })
    }

    if (theme.layout === 'sidebar' || theme.layout === 'folio') {
      return new Paragraph({
        spacing: { before, after: PARAGRAPH_SPACING.sectionAfter },
        children: [
          resumeRun({
            text: text.toUpperCase(),
            bold: true,
            size: RESUME_SIZE.section,
            color: theme.section,
            characterSpacing: 80,
          }),
        ],
      })
    }

    return new Paragraph({
      spacing: { before, after: PARAGRAPH_SPACING.sectionAfter },
      indent: { left: 180 },
      border: {
        left: {
          style: BorderStyle.SINGLE,
          size: 18,
          color: theme.sectionBar,
          space: 8,
        },
      },
      children: [
        resumeRun({
          text,
          bold: true,
          size: RESUME_SIZE.section,
          color: theme.section,
          characterSpacing: 0,
        }),
      ],
    })
  }

  const bodyText = (
    text: string,
    indent = 0,
    after: number = PARAGRAPH_SPACING.bodyAfter,
  ): Paragraph =>
    new Paragraph({
      spacing: { after, ...BODY_LINE_SPACING },
      indent: indent ? { left: indent } : undefined,
      children: [resumeRun({ text, color: theme.body })],
    })

  const bulletItem = (text: string, indent = 280): Paragraph => {
    const bulletChar =
      theme.layout === 'timeline'
        ? '—'
        : theme.layout === 'magazine' || theme.layout === 'ledger'
          ? '◆'
          : theme.layout === 'atelier'
            ? '·'
            : RESUME_BULLET.char

    return new Paragraph({
      spacing: { after: PARAGRAPH_SPACING.bulletAfter, ...BODY_LINE_SPACING },
      indent: { left: indent, hanging: 200 },
      children: [
        resumeRun({
          text: `${bulletChar}\t`,
          color: theme.bullet,
          size: RESUME_BULLET.size,
          characterSpacing: 0,
        }),
        resumeRun({ text, color: theme.body }),
      ],
    })
  }

  const headerDivider = (): Paragraph => {
    const dividerSize = theme.layout === 'timeline' ? 10 : 4
    return new Paragraph({
      spacing: { after: PARAGRAPH_SPACING.headerAfter },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: dividerSize, color: theme.headerDivider },
      },
      children: [resumeRun({ text: '' })],
    })
  }

  const workExperienceParagraphs = (work: WorkExperience, isFirst: boolean): Paragraph[] => {
    const company = getWorkDisplayCompany(work)
    const period = `${work.startDate} — ${work.endDate}`
    const paragraphs: Paragraph[] = []

    if (theme.layout === 'timeline') {
      paragraphs.push(
        workParagraph({
          spacing: {
            before: isFirst ? 0 : PARAGRAPH_SPACING.workBefore,
            after: 40,
          },
          children: [
            resumeRun({
              text: period.toUpperCase(),
              size: RESUME_SIZE.date,
              color: theme.muted,
              characterSpacing: 40,
            }),
          ],
        }),
      )
    }

    paragraphs.push(
      workParagraph({
        spacing: {
          before:
            theme.layout === 'timeline'
              ? 0
              : isFirst
                ? 0
                : PARAGRAPH_SPACING.workBefore,
          after: PARAGRAPH_SPACING.workCompanyAfter,
        },
        tabStops:
          theme.layout === 'timeline'
            ? undefined
            : [{ type: TabStopType.RIGHT, position: TAB_RIGHT }],
        children: [
          resumeRun({
            text: company,
            bold: true,
            size: RESUME_SIZE.company,
            color: theme.heading,
            characterSpacing: 0,
          }),
          ...(theme.layout === 'timeline'
            ? []
            : [
                resumeRun({
                  text: `\t${period}`,
                  size: RESUME_SIZE.date,
                  color: theme.muted,
                  characterSpacing: 0,
                }),
              ]),
        ],
      }),
      workParagraph({
        spacing: { after: PARAGRAPH_SPACING.workPositionAfter, ...BODY_LINE_SPACING },
        children: [
          resumeRun({
            text: work.position,
            size: RESUME_SIZE.position,
            color: theme.title,
            italics: theme.layout === 'magazine' || theme.layout === 'ledger',
            characterSpacing: 0,
          }),
        ],
      }),
    )

    const roleSummary = work.description?.trim()
    if (roleSummary) {
      paragraphs.push(
        workParagraph({
          spacing: { after: PARAGRAPH_SPACING.workSummaryAfter, ...BODY_LINE_SPACING },
          children: [resumeRun({ text: toReadableResumeText(roleSummary), color: theme.body })],
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
              color: theme.bullet,
              size: RESUME_BULLET.size,
              characterSpacing: 0,
            }),
            resumeRun({ text: toReadableResumeText(item), color: theme.body }),
          ],
        }),
      )
    }

    return paragraphs
  }

  const educationParagraph = (edu: Education): Paragraph => {
    const children = []

    if (edu.school.trim()) {
      children.push(
        resumeRun({
          text: edu.school,
          bold: true,
          color: theme.heading,
          characterSpacing: 0,
        }),
      )
    }

    if (edu.major?.trim()) {
      if (children.length > 0) {
        children.push(resumeRun({ text: ' · ', color: theme.title, characterSpacing: 0 }))
      }
      children.push(
        resumeRun({
          text: edu.major,
          color: theme.title,
          characterSpacing: 0,
        }),
      )
    }

    if (edu.degree?.trim()) {
      if (children.length > 0) {
        children.push(resumeRun({ text: ' · ', color: theme.title, characterSpacing: 0 }))
      }
      children.push(
        resumeRun({
          text: edu.degree,
          color: theme.title,
          characterSpacing: 0,
        }),
      )
    }

    return new Paragraph({
      spacing: { after: 80, ...BODY_LINE_SPACING },
      children,
    })
  }

  const buildAvatarImageParagraph = (avatar: DocxAvatarOptions): Paragraph =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0 },
      children: [
        new ImageRun({
          type: avatar.image.type,
          data: avatar.image.data,
          transformation: {
            width: avatar.image.width,
            height: avatar.image.height,
          },
        }),
      ],
    })

  const buildNameParagraph = (name: string): Paragraph =>
    new Paragraph({
      alignment: headerAlignment,
      spacing: { after: 80 },
      children: [
        resumeRun({
          text: name,
          bold: true,
          size:
            theme.layout === 'magazine' || theme.layout === 'ledger'
              ? RESUME_SIZE.name + 4
              : RESUME_SIZE.name,
          color: theme.heading,
          characterSpacing: 0,
        }),
      ],
    })

  const buildTitleParagraph = (title: string, options?: { after?: number }): Paragraph =>
    new Paragraph({
      alignment: headerAlignment,
      spacing: { after: options?.after ?? 80 },
      children: [
        resumeRun({
          text: normalizeDisplayTitle(title),
          size: RESUME_SIZE.title,
          color: theme.title,
          italics: theme.layout === 'magazine' || theme.layout === 'ledger',
          characterSpacing: 0,
        }),
      ],
    })

  const buildTimelineHeaderTable = (
    avatar: DocxAvatarOptions,
    basicInfo: Resume['basicInfo'],
  ): Table => {
    const identityColWidth = TAB_RIGHT - TIMELINE_AVATAR_COL_DXA

    return new Table({
      width: { size: TAB_RIGHT, type: WidthType.DXA },
      columnWidths: [TIMELINE_AVATAR_COL_DXA, identityColWidth],
      borders: BORDERLESS_TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: TIMELINE_AVATAR_COL_DXA, type: WidthType.DXA },
              margins: { top: 0, bottom: 0, left: 0, right: 300 },
              verticalAlign: VerticalAlignTable.TOP,
              children: [buildAvatarImageParagraph(avatar)],
            }),
            new TableCell({
              width: { size: identityColWidth, type: WidthType.DXA },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              verticalAlign: VerticalAlignTable.TOP,
              children: [
                buildNameParagraph(basicInfo.name),
                buildTitleParagraph(basicInfo.title, { after: 0 }),
              ],
            }),
          ],
        }),
      ],
    })
  }

  const buildParagraphs = (
    resume: Resume,
    avatar?: DocxAvatarOptions,
  ): (Paragraph | Table)[] => {
    const { basicInfo } = resume
    const contactParts = getResumeContactItems(resume).map((item) => item.value)

    const children: (Paragraph | Table)[] = []
    const useTimelineSideBySide = theme.layout === 'timeline' && avatar

    if (useTimelineSideBySide) {
      children.push(buildTimelineHeaderTable(avatar, basicInfo))
    } else {
      if (avatar) {
        children.push(
          new Paragraph({
            alignment: avatar.alignment,
            spacing: { after: 120 },
            children: [
              new ImageRun({
                type: avatar.image.type,
                data: avatar.image.data,
                transformation: {
                  width: avatar.image.width,
                  height: avatar.image.height,
                },
              }),
            ],
          }),
        )
      }

      children.push(
        buildNameParagraph(basicInfo.name),
        buildTitleParagraph(basicInfo.title),
      )
    }

    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: {
          before: useTimelineSideBySide ? 240 : undefined,
          after: basicInfo.website ? 120 : 0,
        },
        children: [
          resumeRun({
            text:
              theme.layout === 'sidebar' || theme.layout === 'folio'
                ? contactParts.join('\n')
                : contactParts.join('  ·  '),
            size: RESUME_SIZE.contact,
            color: theme.title,
            characterSpacing: 0,
          }),
        ],
      }),
    )

    if (basicInfo.website?.trim()) {
      const href = formatWebsiteDisplayUrl(basicInfo.website)
      children.push(
        new Paragraph({
          alignment: headerAlignment,
          spacing: { after: 0, ...BODY_LINE_SPACING },
          children: [
            new ExternalHyperlink({
              link: href,
              children: [
                resumeRun({
                  text: `${RESUME_WEBSITE_CTA}${href}`,
                  size: RESUME_SIZE.website,
                  color: theme.link,
                  underline: {},
                  characterSpacing: 0,
                }),
              ],
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
        children.push(educationParagraph(edu))
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

    return children
  }

  return { buildParagraphs }
}

export async function exportToWord(
  resume: Resume,
  filenameOrOptions?: string | ExportToWordOptions,
): Promise<void> {
  const options: ExportToWordOptions =
    typeof filenameOrOptions === 'string'
      ? { filename: filenameOrOptions }
      : (filenameOrOptions ?? {})
  const templateId = resolveResumeTemplateId(
    options.templateId ?? DEFAULT_RESUME_TEMPLATE_ID,
  )
  const theme = getDocxTheme(templateId)
  const { buildParagraphs } = createDocxBuilders(theme)
  const avatarSize = getDocxAvatarSize(theme.layout)
  const avatarImage = await loadResumeAvatarForDocx(resume.basicInfo, avatarSize)
  const avatar = avatarImage
    ? {
        image: avatarImage,
        alignment: getDocxAvatarAlignment(theme.layout),
      }
    : undefined

  const doc = new Document({
    styles: createResumeDocumentStyles(theme),
    sections: [{ properties: {}, children: buildParagraphs(resume, avatar) }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, options.filename ?? `${resume.basicInfo.name}-简历.docx`)
}
