import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const scrollPositions = new Map<string, number>()

/** 返回上一页时恢复滚动位置 */
export const RESTORE_SCROLL_STATE = { restoreScroll: true } as const

/** 前进到新页面滚到顶部；返回或带 restoreScroll 时恢复滚动位置 */
export default function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    const shouldRestore =
      navigationType === 'POP' ||
      (location.state as { restoreScroll?: boolean } | null)?.restoreScroll === true

    const saved = scrollPositions.get(location.pathname)

    if (shouldRestore && saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved))
    } else {
      window.scrollTo(0, 0)
    }

    return () => {
      scrollPositions.set(location.pathname, window.scrollY)
    }
  }, [location.pathname, location.key, location.state, navigationType])

  return null
}
