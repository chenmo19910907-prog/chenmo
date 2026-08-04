import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OptimizePanel from '../components/OptimizePanel'
import ProfileSelector from '../components/ProfileSelector'
import ResumeView from '../components/ResumeView'
import { useResume } from '../context/ResumeContext'
import type { JobMonitorConfig, ResumeProfile } from '../types/job'
import type { Resume } from '../types/resume'
import {
  checkApiHealth,
  fetchBossStatus,
  fetchConfig,
  importJob,
  parseJd,
  previewOptimize,
  quickImportJd,
  refreshBossJobs,
  updateConfig,
} from '../utils/jobApi'
import type { BossStatus, ParsedJd } from '../types/job'

export default function AssistantPage() {
  const navigate = useNavigate()
  const { resume, showMessage } = useResume()
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [config, setConfig] = useState<JobMonitorConfig | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)

  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [previewResume, setPreviewResume] = useState<Resume | null>(null)
  const [previewMeta, setPreviewMeta] = useState<import('../types/job').OptimizeMeta | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [profile, setProfile] = useState<ResumeProfile>('business-expert')
  const [jdRaw, setJdRaw] = useState('')
  const [parsedPreview, setParsedPreview] = useState<ParsedJd | null>(null)
  const [parsing, setParsing] = useState(false)
  const [quickImporting, setQuickImporting] = useState(false)
  const [bossStatus, setBossStatus] = useState<BossStatus | null>(null)
  const [refreshingBoss, setRefreshingBoss] = useState(false)

  const loadConfig = useCallback(async () => {
    const online = await checkApiHealth()
    setApiOnline(online)
    if (!online) return
    try {
      const [data, boss] = await Promise.all([fetchConfig(), fetchBossStatus()])
      setConfig(data)
      setBossStatus(boss)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const applyParsed = (parsed: ParsedJd) => {
    setParsedPreview(parsed)
    if (parsed.company) setCompany(parsed.company)
    if (parsed.title) setTitle(parsed.title)
    if (parsed.description) setDescription(parsed.description)
    if (parsed.requirements) setRequirements(parsed.requirements)
  }

  const channelLabel = (ch?: ParsedJd['channel']) => {
    if (ch === 'boss') return 'Boss直聘'
    if (ch === 'liepin') return '猎聘'
    return '其他渠道'
  }

  const handleParseJd = async () => {
    if (!jdRaw.trim()) {
      showMessage('请先粘贴完整 JD')
      return
    }
    setParsing(true)
    try {
      const { parsed } = await parseJd(jdRaw)
      applyParsed(parsed)
      showMessage(`已解析：${parsed.title || '岗位'} · ${parsed.company || '公司待确认'}`)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }

  const handleQuickImport = async () => {
    if (!jdRaw.trim()) {
      showMessage('请先粘贴完整 JD')
      return
    }
    setQuickImporting(true)
    try {
      const { job, parsed } = await quickImportJd(jdRaw)
      applyParsed(parsed)
      showMessage(`已导入：${job.company} · ${job.title}`)
      setJdRaw('')
      setParsedPreview(null)
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '导入失败')
    } finally {
      setQuickImporting(false)
    }
  }

  const handlePreview = async () => {
    if (!title.trim() && !description.trim()) {
      showMessage('请至少填写岗位名称或 JD 描述')
      return
    }
    setPreviewing(true)
    try {
      const result = await previewOptimize({
        company,
        title,
        description,
        requirements,
        resume,
        profile,
      })
      setPreviewResume(result.resume)
      setPreviewMeta(result.meta)
      showMessage(`预览完成，匹配度 ${result.meta.matchScore}%`)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '预览失败')
    } finally {
      setPreviewing(false)
    }
  }

  const handleImport = async () => {
    if (!title.trim()) {
      showMessage('请填写岗位名称')
      return
    }
    setImporting(true)
    try {
      await importJob({ company, title, description, requirements })
      showMessage('JD 已导入，可在岗位监控中查看并生成定制简历')
      setCompany('')
      setTitle('')
      setDescription('')
      setRequirements('')
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setSavingConfig(true)
    try {
      await updateConfig(config)
      showMessage('监控配置已保存，定时任务已重启')
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRefreshBoss = async () => {
    setRefreshingBoss(true)
    try {
      const result = await refreshBossJobs()
      showMessage(`Boss 直聘抓取 ${result.fetched} 条岗位`)
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Boss 抓取失败')
    } finally {
      setRefreshingBoss(false)
    }
  }

  const updateCompanyEnabled = (id: string, enabled: boolean) => {
    if (!config) return
    setConfig({
      ...config,
      companies: config.companies.map((c) => (c.id === id ? { ...c, enabled } : c)),
    })
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">求职助手</h1>
        <p className="mt-1 text-sm text-slate-500">
          推荐：从 Boss / 猎聘复制 JD → 一键导入 → 自动生成定制简历
        </p>

        {apiOnline === false && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            请先运行 <code className="rounded bg-amber-100 px-1">npm run dev:all</code>{' '}
            启动求职助手服务
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">一键粘贴 JD 导入（推荐）</h2>
                <p className="mt-1 text-sm text-slate-500">
                  在 Boss / 猎聘岗位详情页全选复制，粘贴后点「一键导入」
                </p>
              </div>
              <Link
                to="/jobs"
                className="text-sm text-blue-600 hover:underline"
              >
                查看岗位库 →
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-white/80 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Boss 直聘怎么复制？</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>打开岗位详情页（不要开 F12）</li>
                  <li>从岗位名称拖到「任职要求」末尾，Ctrl+A / Cmd+A 全选</li>
                  <li>Ctrl+C / Cmd+C 复制，粘贴到下方文本框</li>
                </ol>
                <p className="mt-3 font-medium text-slate-800">猎聘同理</p>
                <p className="mt-1 text-xs text-slate-400">支持 Ctrl+Enter 快捷导入</p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={jdRaw}
                  onChange={(e) => {
                    setJdRaw(e.target.value)
                    setParsedPreview(null)
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleQuickImport()
                    }
                  }}
                  placeholder={'示例：\n语音社交-高级测试工程师\n25-50K·16薪\n北京·朝阳区·3-5年·本科\n字节跳动\n\n职位描述\n1. 负责...\n\n任职要求\n1. 5年以上...'}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!apiOnline || quickImporting || !jdRaw.trim()}
                    onClick={handleQuickImport}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {quickImporting ? '导入中…' : '一键解析并导入'}
                  </button>
                  <button
                    type="button"
                    disabled={!apiOnline || parsing || !jdRaw.trim()}
                    onClick={handleParseJd}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {parsing ? '解析中…' : '仅解析预览'}
                  </button>
                </div>
              </div>
            </div>

            {parsedPreview && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
                <p className="font-medium text-emerald-800">解析结果</p>
                <div className="mt-2 grid gap-1 text-slate-700 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-400">来源：</span>
                    {channelLabel(parsedPreview.channel)}
                  </p>
                  <p>
                    <span className="text-slate-400">公司：</span>
                    {parsedPreview.company || '待确认'}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-slate-400">岗位：</span>
                    {parsedPreview.title || '待确认'}
                  </p>
                  {parsedPreview.salary && (
                    <p>
                      <span className="text-slate-400">薪资：</span>
                      {parsedPreview.salary}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <details className="group">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900 marker:content-none">
                <span className="flex items-center gap-2">
                  <span className="text-slate-400 transition group-open:rotate-90">▶</span>
                  Boss 直聘自动抓取（高级，常遇安全验证）
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-500">
                需配置 Cookie，且 Boss 可能拦截自动化浏览器。更推荐使用上方「一键粘贴导入」。
              </p>
            {bossStatus && (
              <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
                <p>
                  状态：
                  <span className={bossStatus.enabled ? 'text-emerald-600' : 'text-slate-500'}>
                    {bossStatus.enabled ? '已配置' : '未配置'}
                  </span>
                  {!bossStatus.playwrightAvailable && (
                    <span className="ml-2 text-amber-600">
                      （需运行 npx playwright install chromium）
                    </span>
                  )}
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-slate-600">
                  <li>浏览器登录 zhipin.com</li>
                  <li>DevTools → Application → Cookies，复制完整 Cookie</li>
                  <li>
                    粘贴到{' '}
                    <code className="rounded bg-slate-200 px-1">server/config/boss.json</code>{' '}
                    的 cookie 字段，并设置 enabled: true
                  </li>
                  <li>或设置环境变量 CHENMO_BOSS_COOKIE</li>
                </ol>
                <p className="text-xs text-slate-400">
                  搜索词：{bossStatus.queries?.join('、') || '见 boss.json'}
                </p>
                <button
                  type="button"
                  disabled={!apiOnline || refreshingBoss}
                  onClick={handleRefreshBoss}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                >
                  {refreshingBoss ? '抓取中…' : '立即抓取 Boss 岗位'}
                </button>
              </div>
            )}
            </details>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">岗位信息 · 定向优化</h2>
            <p className="mt-1 text-sm text-slate-500">核对字段并选择求职方向（默认：业务专家）</p>

            <div className="mt-3">
              <ProfileSelector value={profile} onChange={setProfile} />
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="公司名称"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="岗位名称 *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="岗位描述 / 工作职责"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="任职要求 / 技能要求"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!apiOnline || previewing}
                onClick={handlePreview}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {previewing ? '分析中…' : '预览优化'}
              </button>
              <button
                type="button"
                disabled={!apiOnline || importing}
                onClick={handleImport}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {importing ? '导入中…' : '导入到岗位库'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">监控配置</h2>
            <p className="mt-1 text-sm text-slate-500">选择关注的公司与自动刷新频率</p>

            {config && (
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  />
                  启用定时监控
                </label>

                <div>
                  <label className="text-xs text-slate-500">刷新间隔（小时）</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={config.refreshIntervalHours}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        refreshIntervalHours: Number(e.target.value) || 12,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">全局关键词（逗号分隔）</label>
                  <input
                    type="text"
                    value={config.keywords.join('，')}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        keywords: e.target.value.split(/[,，]/).map((k) => k.trim()).filter(Boolean),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">监控公司</p>
                  <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {config.companies.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={c.enabled !== false}
                          onChange={(e) => updateCompanyEnabled(c.id, e.target.checked)}
                        />
                        <span>{c.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!apiOnline || savingConfig}
                  onClick={handleSaveConfig}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {savingConfig ? '保存中…' : '保存配置'}
                </button>
              </div>
            )}
          </section>
        </div>

        {previewResume && previewMeta && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">优化预览</h2>
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <ResumeView resume={previewResume} />
              <OptimizePanel meta={previewMeta} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
