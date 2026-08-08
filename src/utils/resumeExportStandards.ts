/**
 * Word 简历导出版式规范
 *
 * 实现入口：
 * - {@link ./resumeDocxTheme.ts} — 字体、颜色、行距、段距常量
 * - {@link ./exportDocx.ts} — 段落结构与导出逻辑
 *
 * 预览对照：{@link ../components/ResumeView.tsx}
 *
 * 内容规范（简介段落顺序、去「核心匹配」等）见 {@link ./resumeGenerationStandards.ts}
 */

/** twips 换算：20 twips ≈ 1pt；240 twips = 单倍行距基准 */
export const RESUME_EXPORT_SPEC = {
  /** 全文字体 */
  font: 'PingFang SC',

  /**
   * docx 字号单位为半磅（half-points）
   * 约等于预览 px × 1.5
   */
  fontSize: {
    name: 48,
    title: 23,
    contact: 20,
    website: 20,
    section: 20,
    body: 21,
    company: 23,
    position: 20,
    date: 18,
  },

  color: {
    heading: '0F172A',
    title: '64748B',
    body: '475569',
    muted: '94A3B8',
    section: '1E293B',
    link: '2563EB',
    sectionBar: '2563EB',
    headerDivider: 'F1F5F9',
    bullet: '3B82F6',
  },

  /** 正文行距：line 252 ≈ 1.05 倍（240 为单倍） */
  bodyLineSpacing: { line: 252, lineRule: 'auto' as const },

  /** 正文字间距（twips，负值收紧）；标题/公司名/日期等显式设为 0 */
  bodyCharacterSpacing: -12,

  spacing: {
    bodyAfter: 60,
    /** 个人简介段间，对应预览 space-y-3（12px ≈ 180 twips） */
    summaryAfter: 180,
    sectionBefore: 200,
    /** 学历、自我评价等区块标题额外段前距（twips） */
    sectionTitleExtraBefore: 160,
    /** 区块标题与正文，对应预览 mb-4（16px ≈ 240 twips） */
    sectionAfter: 240,
    /** 工作经历段间，对应预览 space-y-7（28px ≈ 480 twips） */
    workBefore: 480,
    workCompanyAfter: 24,
    workPositionAfter: 120,
    workSummaryAfter: 100,
    /** 要点列表项间距，对应预览 space-y-2 */
    bulletAfter: 80,
    headerAfter: 160,
  },

  bullet: {
    char: '●',
    color: '3B82F6',
    size: 12,
    indentLeft: 280,
    hanging: 200,
  },

  layout: {
    /** A4 默认页边距下，日期/学位右对齐制表位 */
    tabRight: 9026,
    sectionTitleIndent: 180,
    sectionBarSize: 18,
    sectionBarSpace: 8,
    maxWorkHighlights: 5,
  },
} as const

export type ResumeExportSpec = typeof RESUME_EXPORT_SPEC

/**
 * 页眉：姓名、头衔、联系方式（· 分隔）居中；有个人主页时追加链接行，再跟浅灰分隔线。
 */
export const RESUME_EXPORT_HEADER_RULES = [
  '姓名加粗居中',
  '头衔居中（normalizeDisplayTitle 去尾缀）',
  '电话 · 邮箱 · 地点 · 学历 居中',
  '有个人主页：更多项目与作品见个人主页：{url}（链接保留 https://）',
  '页眉底部分隔线（F1F5F9）',
] as const

/**
 * 区块标题：左侧蓝色竖条 + 加粗标题；段后留白 sectionAfter。
 */
export const RESUME_EXPORT_SECTION_RULES = [
  '个人简介',
  '工作经历',
  '学历',
  '自我评价（有内容时）',
] as const

/**
 * 个人简介：cleanResumeSummary → splitSummaryParagraphs；段间 summaryAfter。
 */
export const RESUME_EXPORT_SUMMARY_RULES = [
  '不使用「核心匹配」前缀',
  '个人主页写在 basicInfo.website，不追加为简介第四段',
  '段落顺序见 resumeGenerationStandards（履历 → 平台 Agent → 业绩）',
] as const

/**
 * 工作经历：纯段落，无左侧竖线、无表格外框。
 */
export const RESUME_EXPORT_WORK_RULES = [
  '第一行：公司名（粗体）+ 日期（右对齐制表位）',
  '第二行：职位',
  '可选第三段：岗位描述（work.description）',
  '要点最多 5 条；蓝色 ● 自定义圆点，禁用 Word 默认项目符号',
  '非首段工作经历前留白 workBefore',
] as const

/**
 * 学历：单行「学校 · 专业 · 学位」。
 */
export const RESUME_EXPORT_EDUCATION_RULES = [
  '学校 · 专业 · 学位 同一行，点号间隔',
] as const
