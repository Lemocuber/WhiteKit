import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState, type CSSProperties } from 'react'

interface Viewport {
  height: number
  tick: number
  width: number
}

type ViewportStyle = CSSProperties & {
  '--resize-tick': number
}

export function useWindowResizeInvalidation(): ViewportStyle {
  const [viewport, setViewport] = useState<Viewport>(() => ({
    ...readBrowserViewport(),
    tick: 0,
  }))

  useEffect(() => {
    let active = true
    let frameId = 0
    const timeoutIds = new Set<number>()
    let unlistenTauriResize: (() => void) | undefined
    let unlistenTauriScaleChange: (() => void) | undefined
    let unlistenTauriFocusChange: (() => void) | undefined

    const applyViewport = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (!active) return
        const size = readBrowserViewport()

        setViewport((current) => (
          current.height === size.height && current.width === size.width
            ? current
            : {
                height: size.height,
                tick: current.tick + 1,
                width: size.width,
              }
        ))
      })
    }

    const applySettledViewport = () => {
      const size = readBrowserViewport()

      setViewport((current) => ({
        height: size.height,
        tick: current.tick + 1,
        width: size.width,
      }))
    }

    const scheduleViewportSync = (includeSettledSync = false) => {
      applyViewport()
      if (!includeSettledSync) return

      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeoutIds.clear()

      for (const delay of [60, 180, 360]) {
        const timeoutId = window.setTimeout(() => {
          timeoutIds.delete(timeoutId)
          applySettledViewport()
        }, delay)

        timeoutIds.add(timeoutId)
      }
    }

    const visualViewport = window.visualViewport
    const handleViewportChange = () => scheduleViewportSync()
    const handleNativeViewportChange = () => scheduleViewportSync(true)

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('focus', handleNativeViewportChange)
    window.addEventListener('pageshow', handleNativeViewportChange)
    document.addEventListener('visibilitychange', handleNativeViewportChange)
    visualViewport?.addEventListener('resize', handleViewportChange)
    scheduleViewportSync(true)

    if (isTauri()) {
      const currentWindow = getCurrentWindow()

      void currentWindow.onResized(handleNativeViewportChange).then((unlisten) => {
        if (active) {
          unlistenTauriResize = unlisten
        } else {
          unlisten()
        }
      }).catch(handleNativeViewportChange)

      void currentWindow.onScaleChanged(handleNativeViewportChange).then((unlisten) => {
        if (active) {
          unlistenTauriScaleChange = unlisten
        } else {
          unlisten()
        }
      }).catch(handleNativeViewportChange)

      void currentWindow.onFocusChanged(handleNativeViewportChange).then((unlisten) => {
        if (active) {
          unlistenTauriFocusChange = unlisten
        } else {
          unlisten()
        }
      }).catch(handleNativeViewportChange)
    }

    return () => {
      active = false
      window.cancelAnimationFrame(frameId)
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('focus', handleNativeViewportChange)
      window.removeEventListener('pageshow', handleNativeViewportChange)
      document.removeEventListener('visibilitychange', handleNativeViewportChange)
      visualViewport?.removeEventListener('resize', handleViewportChange)
      unlistenTauriResize?.()
      unlistenTauriScaleChange?.()
      unlistenTauriFocusChange?.()
    }
  }, [])

  return {
    '--resize-tick': viewport.tick,
    height: `${viewport.height}px`,
    width: `${viewport.width}px`,
  }
}

function readBrowserViewport() {
  const visualViewport = window.visualViewport

  return {
    height: Math.max(1, Math.round(visualViewport?.height || window.innerHeight || document.documentElement.clientHeight)),
    width: Math.max(1, Math.round(visualViewport?.width || window.innerWidth || document.documentElement.clientWidth)),
  }
}
