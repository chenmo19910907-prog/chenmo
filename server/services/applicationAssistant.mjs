/** Boss / 猎聘粘贴时的 UI 噪音行 */
const JD_NOISE_PATTERNS = [
  /^立即沟通$/,
  /^收藏$/,
  /^举报$/,
  /^查看更多信息$/,
  /^BOSS直聘$/,
  /^猎聘$/,
  /^相似职位$/,
  /^公司主页$/,
  /^下载APP$/,
  /^登录/,
  /^分享$/,
  /^\d+人浏览$/,
  /^\d+分钟前$/,
  /^今日活跃$/,
  /^在线$/,
]

function detectJdChannel(text) {
  if (/zhipin\.com|boss直聘/i.test(text)) return 'boss'
  if (/liepin\.com|猎聘/i.test(text)) return 'liepin'
  return 'other'
}

function isNoiseLine(line) {
  if (!line || line.length < 2) return true
  if (JD_NOISE_PATTERNS.some((p) => p.test(line))) return true
  return false
}

function isSalaryLine(line) {
  return /\d+[-~～]\d+\s*[Kk万]|^\d+[Kk]|薪·\d+|·\d+薪/.test(line)
}

function isLocationMetaLine(line) {
  return (
    /^[^·]{2,8}·[^·]+·(\d+[-~～]\d+年|经验不限|应届)/.test(line) ||
    (/^(北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|苏州|天津|重庆|长沙|郑州|青岛|厦门|合肥|东莞|佛山|无锡|宁波|珠海|大连|沈阳|济南|福州|昆明|哈尔滨|长春|石家庄|太原|南昌|贵阳|南宁|海口|兰州|银川|西宁|乌鲁木齐|呼和浩特)/.test(
      line,
    ) &&
      /·/.test(line) &&
      line.length < 40)
  )
}

function isCompanyLine(line) {
  if (line.length < 2 || line.length > 30) return false
  if (/职责|要求|描述|薪资|福利|地址|地图|融资|规模/.test(line)) return false
  if (isSalaryLine(line) || isLocationMetaLine(line)) return false
  return (
    /(?:科技|网络|信息|互联网|集团|公司|有限|Inc|Ltd|工作室|实验室|研究院)/.test(line) ||
    /^[\u4e00-\u9fffA-Za-z0-9（）()]{2,20}$/.test(line)
  )
}

/**
 * 从 Boss 直聘 / 猎聘等粘贴文本中解析 JD 字段
 * @param {string} text
 */
export function parseJdText(text) {
  if (!text || typeof text !== 'string') {
    return {
      company: '',
      title: '',
      description: '',
      requirements: '',
      channel: 'other',
    }
  }

  const channel = detectJdChannel(text)
  const raw = text.replace(/\r\n/g, '\n').trim()
  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => !isNoiseLine(l))

  let company = ''
  let title = ''
  let salary = ''
  let location = ''
  let description = ''
  let requirements = ''

  for (const line of lines.slice(0, 12)) {
    const cm = line.match(/^(?:公司|企业|招聘单位)[：:\s]\s*(.+)$/)
    if (cm && !company) company = cm[1].trim()
    const tm = line.match(/^(?:职位|岗位|招聘|招聘职位)[：:\s]\s*(.+)$/)
    if (tm && !title) title = tm[1].trim()
    const sm = line.match(/(?:薪资|工资|薪酬)[：:\s]\s*(.+)/)
    if (sm && !salary) salary = sm[1].trim()
    const lm = line.match(/(?:地点|工作地)[：:\s]\s*(.+)/)
    if (lm && !location) location = lm[1].trim()
  }

  if (!title) {
    for (const line of lines.slice(0, 6)) {
      if (isSalaryLine(line) || isLocationMetaLine(line) || isCompanyLine(line)) continue
      if (/职责|要求|描述|福利|标签/.test(line)) continue
      if (line.length >= 2 && line.length <= 40) {
        title = line.replace(/\s*【.*?】\s*$/, '').trim()
        break
      }
    }
  }

  if (!salary) {
    const salaryLine = lines.slice(0, 8).find((l) => isSalaryLine(l))
    if (salaryLine) salary = salaryLine.trim()
  }

  if (!location) {
    const locLine = lines.slice(0, 8).find((l) => isLocationMetaLine(l))
    if (locLine) location = locLine.trim()
  }

  if (!company) {
    const headerEnd = lines.findIndex((l) =>
      /职位描述|岗位职责|工作内容|任职要求|岗位要求/.test(l),
    )
    const headerLines = headerEnd > 0 ? lines.slice(0, headerEnd) : lines.slice(0, 8)
    const companyCandidate = headerLines
      .filter((l) => l !== title && !isSalaryLine(l) && !isLocationMetaLine(l))
      .find((l) => isCompanyLine(l))
    if (companyCandidate) company = companyCandidate
  }

  let current = 'description'
  const buckets = { description: [], requirements: [] }
  let inHeader = true

  for (const line of lines) {
    if (/^职位描述$|^岗位职责$|^工作内容$|^职责描述$/.test(line)) {
      current = 'description'
      inHeader = false
      continue
    }
    if (/^任职要求$|^岗位要求$|^职位要求$|^任职资格$/.test(line)) {
      current = 'requirements'
      inHeader = false
      continue
    }
    if (/任职要求|岗位要求|职位要求|任职资格/.test(line) && /[：:]/.test(line)) {
      current = 'requirements'
      inHeader = false
      const rest = line.replace(/^[^：:]*[：:]/, '').trim()
      if (rest) buckets.requirements.push(rest)
      continue
    }
    if (/岗位职责|职位描述|工作内容|职责描述/.test(line) && /[：:]/.test(line)) {
      current = 'description'
      inHeader = false
      const rest = line.replace(/^[^：:]*[：:]/, '').trim()
      if (rest) buckets.description.push(rest)
      continue
    }

    if (inHeader) {
      if (line === title || line === company || isSalaryLine(line) || isLocationMetaLine(line)) {
        continue
      }
      if (isCompanyLine(line) && !company) {
        company = line
        continue
      }
    }

    if (line === title || line === company) continue
    buckets[current].push(line)
  }

  description = buckets.description.join('\n').trim()
  requirements = buckets.requirements.join('\n').trim()

  if (!description && !requirements) {
    const splitAt = lines.findIndex((l) => /^任职要求|^岗位要求/.test(l))
    if (splitAt > 0) {
      description = lines
        .slice(0, splitAt)
        .filter((l) => l !== title && l !== company && !isSalaryLine(l) && !isLocationMetaLine(l))
        .join('\n')
      requirements = lines.slice(splitAt).join('\n')
    } else {
      description = lines
        .filter((l) => l !== title && l !== company && !isSalaryLine(l) && !isLocationMetaLine(l))
        .join('\n')
    }
  }

  if (!company) {
    const m = raw.match(/[\u4e00-\u9fffA-Za-z0-9（）()]+(?:科技|集团|公司|有限|网络|信息)[^\n]{0,16}/)
    if (m) company = m[0].trim()
  }

  description = description.replace(/^(职位描述|岗位职责|工作内容)[：:\s]*/m, '').trim()
  requirements = requirements.replace(/^(任职要求|岗位要求|职位要求)[：:\s]*/m, '').trim()

  const metaParts = []
  if (salary) metaParts.push(`薪资：${salary}`)
  if (location) metaParts.push(`地点：${location}`)
  if (metaParts.length && description) {
    description = `${metaParts.join(' · ')}\n\n${description}`
  } else if (metaParts.length && !description) {
    description = metaParts.join(' · ')
  }

  return { company, title, description, requirements, salary, location, channel }
}

export const PROFILE_LABELS = {
  'business-expert': '业务专家',
  platform: '平台 / 测开',
  management: '管理 / 组长',
}

export function generateCoverLetter(job, resume, profile, meta) {
  const name = resume.basicInfo?.name ?? '候选人'
  const title = resume.basicInfo?.title ?? '测试工程师'
  const company = job.company || '贵司'
  const jobTitle = job.title || '该岗位'
  const matched = (meta?.matchedKeywords ?? []).slice(0, 4).join('、')

  const opening =
    profile === 'management'
      ? `您好，我是${name}，${title}，有团队管理与交付经验，看到${company}招聘「${jobTitle}」，与我的职业方向高度契合，特此投递。`
      : profile === 'platform'
        ? `您好，我是${name}，${title}，在语音房社交领域有深厚业务积累，并独立搭建过智能测试工具平台，看到${company}「${jobTitle}」岗位，特此投递。`
        : `您好，我是${name}，${title}，9 年语音房社交赛道业务测试经验，深度理解 PK、送礼、活动运营等核心玩法，看到${company}招聘「${jobTitle}」，与我的专长高度匹配，特此投递。`

  const bodyParts = []
  if (profile === 'business-expert') {
    bodyParts.push(
      '职业生涯聚焦语音房社交：小米视频直播 → 帧趣「撕歌」质量负责人（陪伴产品从濒临解散到年流水 2 亿）→ 陌陌海外 Yaahlan 房间玩法测试专家。擅长在快速试错与高频发版中把握质量与业务平衡。',
    )
    if (matched) bodyParts.push(`与贵司 JD 匹配的核心能力包括：${matched}。`)
    bodyParts.push(
      '在陌陌阶段主攻 PK、跨房、礼物、活动、上麦等房间玩法，并将业务测试经验沉淀为团队提效工具，业务侧 adoption 约 50%。',
    )
  } else if (profile === 'platform') {
    bodyParts.push(
      '除语音房社交业务测试外，我从 AI 脚本试水出发，独立搭建智能工具 Agent 体系（平台 + Web Agent + 对内 Keynote），215+ 项能力、日调用量提升 2.3 倍，服务研发/产品/测试全项目。',
    )
    if (matched) bodyParts.push(`JD 关键词匹配：${matched}。`)
  } else {
    bodyParts.push(
      '曾任帧趣「撕歌」质量负责人（直接向 CEO 汇报，后期带 3 人），云测科技游戏测试组组长（带 4–8 人），具备测试计划、人力协调、客户对接与交付管理经验。',
    )
    if (matched) bodyParts.push(`与岗位匹配：${matched}。`)
  }

  const closing = `期待有机会进一步交流，感谢您的时间。\n\n${name}\n${resume.basicInfo?.phone ?? ''} · ${resume.basicInfo?.email ?? ''}`
  return [opening, ...bodyParts, closing].join('\n\n')
}

export function generateSelfIntro(job, resume, profile) {
  const name = resume.basicInfo?.name ?? '我'
  const snippets = {
    'business-expert': `${name}，9 年语音房社交业务测试专家。撕歌任质量负责人，深度参与产品从濒临解散到年流水 2 亿；现于陌陌 Yaahlan 主攻房间玩法（PK/跨房/礼物/活动），并将业务经验沉淀为团队提效工具。擅长快速试错期保主流程、稳定期做深度测试。`,
    platform: `${name}，语音房社交测试背景 + 智能工具平台建设。在陌陌从 AI 脚本演进为 Web Agent 体系，215+ 能力、业务侧一半同事在使用，日调用提升 2.3 倍。既懂玩法逻辑，也能用工具释放团队重复劳动。`,
    management: `${name}，测试管理经验覆盖撕歌质量负责人（带 3 人、对 CEO）与云测游戏测试组长（带 4–8 人）。9 年语音房/游戏社交测试，熟悉海内外发版、客户对接与交付节奏。`,
  }
  const tail = job.company ? `看到${job.company}「${job.title}」岗位，认为与我的经历非常契合。` : ''
  return `${snippets[profile] ?? snippets['business-expert']} ${tail}`.trim()
}

export function generateInterviewPrep(job, resume, meta) {
  const jdText = [job.title, job.description, job.requirements].join('\n')
  const questions = []

  questions.push({
    question: '请介绍一下你自己，以及为什么应聘这个岗位？',
    hints: [
      '用 1 分钟版自我介绍：语音房赛道 9 年 → 撕歌业务共建 → 陌陌房间玩法',
      `点题 ${job.company} ${job.title}，强调匹配：${(meta?.matchedKeywords ?? []).slice(0, 3).join('、') || '业务深度'}`,
    ],
  })

  if (/语音房|语聊|直播|社交/.test(jdText)) {
    questions.push({
      question: '你对语音房/社交产品的测试有什么理解？核心风险点在哪里？',
      hints: [
        '核心链路：上麦/PK/送礼/活动/榜单；商业化与体验平衡',
        '撕歌：K 歌 + 送礼活动为收入支柱；陌陌：PK/跨房/上麦 + 海外多语言',
        '风险：活动规则边界、并发、支付、跨房状态同步、海外 RTL/时区',
      ],
    })
  }

  if (/海外|Google Play|App Store|多语言/.test(jdText)) {
    questions.push({
      question: '谈谈你的海外发版或多语言测试经验。',
      hints: [
        'Yaahlan：Google Play / App Store、阿/英/土多语言、RTL',
        '云测：《ARBS》等海外手游 TestFlight / Google Play 流程',
      ],
    })
  }

  if (/组长|管理|团队/.test(jdText)) {
    questions.push({
      question: '有没有团队管理经验？怎么带团队、排期和处理冲突？',
      hints: [
        '撕歌：2 人→带 3 人，对 CEO；活动周更 + 大小版并行',
        '云测：游戏测试组长 4–8 人，客户对接、交付精英奖',
      ],
    })
  }

  if (/自动化|平台|工具/.test(jdText)) {
    questions.push({
      question: '你在测试工具化/自动化方面有什么实践？',
      hints: [
        '业务驱动：从 AI 脚本到智能工具 Agent，MOA 造数 + Tunnel 抓包 + 工作流',
        '强调解决业务重复劳动，而非为自动化而自动化',
      ],
    })
  }

  if (meta?.missingKeywords?.length) {
    questions.push({
      question: `JD 中的「${meta.missingKeywords.slice(0, 2).join('」「')}」你有相关经验吗？`,
      hints: [
        '诚实说明现有经验边界，关联最接近的项目经历',
        '可补充：学习意愿 + 已有可迁移能力',
      ],
    })
  }

  questions.push({
    question: '撕歌从濒临解散到年流水 2 亿，你作为质量负责人具体做了什么？',
    hints: [
      '入职半年融资困境 → 玩法试错期保主流程 → 转型营收活动/嘻哈品牌',
      '深度参与方向讨论，质量反馈支撑 pivot；后期带 3 人支撑高频发版',
    ],
  })

  return {
    jobTitle: job.title,
    company: job.company,
    matchScore: meta?.matchScore ?? 0,
    questions,
    generalTips: [
      '业务专家定位：多讲玩法理解、业务判断、质量与速度平衡',
      '准备 1–2 个 PK/活动/送礼相关的具体 bug 或风险拦截案例',
      '平台经历作为加分项：强调「懂业务的人才能做出好用的工具」',
    ],
  }
}

export const APPLICATION_STATUSES = [
  'watching',
  'todo',
  'applied',
  'interview',
  'offer',
  'rejected',
  'archived',
]

export const STATUS_LABELS = {
  watching: '观望',
  todo: '待投递',
  applied: '已投递',
  interview: '面试中',
  offer: 'Offer',
  rejected: '已拒绝',
  archived: '已归档',
}
