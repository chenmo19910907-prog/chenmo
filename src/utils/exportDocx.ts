import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Resume } from '../types/resume'

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: '1E40AF',
      }),
    ],
  })
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })],
  })
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22 })],
  })
}

function boldLine(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  })
}

function mutedLine(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 20, color: '64748B' })],
  })
}

export async function exportToWord(resume: Resume): Promise<void> {
  const { basicInfo } = resume
  const contactParts = [
    basicInfo.phone,
    basicInfo.email,
    basicInfo.location,
    basicInfo.website,
    basicInfo.github,
  ].filter(Boolean)

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: basicInfo.name, bold: true, size: 48 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: basicInfo.title, size: 26, color: '475569' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: contactParts.join('  |  '), size: 20, color: '64748B' }),
      ],
    }),
    sectionTitle('个人简介'),
    bodyText(resume.summary),
  ]

  if (resume.workExperiences.length > 0) {
    children.push(sectionTitle('工作经历'))
    for (const work of resume.workExperiences) {
      children.push(
        boldLine(`${work.company}  ·  ${work.position}`),
        mutedLine(`${work.startDate} - ${work.endDate}`),
        bodyText(work.description),
      )
      for (const item of work.highlights) {
        children.push(bulletItem(item))
      }
    }
  }

  if (resume.projectExperiences.length > 0) {
    children.push(sectionTitle('项目经历'))
    for (const project of resume.projectExperiences) {
      children.push(
        boldLine(`${project.name}  ·  ${project.role}`),
        mutedLine(`${project.startDate} - ${project.endDate}`),
        bodyText(project.description),
        bodyText(`技术栈：${project.techStack.join('、')}`),
      )
      for (const item of project.highlights) {
        children.push(bulletItem(item))
      }
    }
  }

  if (resume.educations.length > 0) {
    children.push(sectionTitle('教育背景'))
    for (const edu of resume.educations) {
      children.push(
        boldLine(`${edu.school}  ·  ${edu.degree}  ·  ${edu.major}`),
        mutedLine(`${edu.startDate} - ${edu.endDate}`),
      )
    }
  }

  if (resume.skillGroups.length > 0) {
    children.push(sectionTitle('专业技能'))
    for (const group of resume.skillGroups) {
      children.push(
        bodyText(`${group.category}：${group.items.join('、')}`),
      )
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${basicInfo.name}-简历.docx`)
}
