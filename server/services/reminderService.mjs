/**
 * 投递提醒：基于 nextActionDate 计算逾期与即将到期
 * @param {object[]} applications
 */
export function computeReminders(applications) {
  const now = new Date()
  const today = startOfDay(now)
  const inThreeDays = new Date(today)
  inThreeDays.setDate(inThreeDays.getDate() + 3)

  const overdue = []
  const upcoming = []

  for (const app of applications ?? []) {
    if (!app.nextActionDate || app.status === 'archived' || app.status === 'rejected') {
      continue
    }
    const due = startOfDay(new Date(app.nextActionDate))
    if (Number.isNaN(due.getTime())) continue

    const item = {
      applicationId: app.id,
      jobId: app.jobId,
      company: app.company,
      jobTitle: app.jobTitle,
      status: app.status,
      nextAction: app.nextAction,
      nextActionDate: app.nextActionDate,
      daysUntil: Math.round((due.getTime() - today.getTime()) / 86400000),
    }

    if (due < today) {
      overdue.push(item)
    } else if (due <= inThreeDays) {
      upcoming.push(item)
    }
  }

  overdue.sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime())
  upcoming.sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime())

  return { overdue, upcoming, total: overdue.length + upcoming.length }
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
