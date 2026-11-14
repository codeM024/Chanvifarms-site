import { useEffect } from 'react'
import { useTiffin } from '../../Context/tiffinStore'

/**
 * Loads the tiffin menu (once) and re-checks the open/closed state every
 * `intervalMs` while the page is mounted and visible, so the banner and
 * buttons flip live when an ordering window opens or closes.
 */
const useOrderingPoll = (intervalMs = 60000) => {
  const { loadMenu, refreshStatus } = useTiffin()

  useEffect(() => {
    loadMenu()
  }, [loadMenu])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refreshStatus()
    }
    const id = window.setInterval(tick, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshStatus()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshStatus, intervalMs])
}

export default useOrderingPoll
