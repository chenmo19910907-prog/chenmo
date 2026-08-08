import type { WorkExperience } from '../types/resume'

/** 详情页头部、个人介绍工作卡片使用的展示标题 */
export function getWorkDisplayCompany(work: WorkExperience): string {
  return work.displayCompany ?? work.company
}
