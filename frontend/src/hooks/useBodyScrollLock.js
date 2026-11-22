import { useEffect } from 'react'

let lockCount = 0
let previousStyles = null

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined

    if (lockCount === 0) {
      previousStyles = {
        bodyOverflow: document.body.style.overflow,
        htmlOverflow: document.documentElement.style.overflow,
        touchAction: document.body.style.touchAction,
        htmlTouchAction: document.documentElement.style.touchAction,
      }
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.touchAction = 'auto'
      document.documentElement.style.touchAction = 'auto'
    }
    lockCount += 1

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0 && previousStyles) {
        document.body.style.overflow = previousStyles.bodyOverflow
        document.documentElement.style.overflow = previousStyles.htmlOverflow
        document.body.style.touchAction = previousStyles.touchAction
        document.documentElement.style.touchAction = previousStyles.htmlTouchAction
        previousStyles = null
      }
    }
  }, [isLocked])
}
