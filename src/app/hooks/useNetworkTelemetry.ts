import { isTauri } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'

export type NetworkState = 'checking' | 'online' | 'offline'

const HISTORY_LENGTH = 22
const GRAPH_MAX_BYTES_PER_SECOND = 10_000_000
const GRAPH_CURVE_EXPONENT = 0.35
const GRAPH_STEP = 5
const GRAPH_BASELINE_Y = 98.5
const NETWORK_SAMPLE_EVENT = 'network-traffic-sample'

interface NetworkTrafficSample {
  bytesLastSecond: number
}

function clampGraphSpeed(bytesPerSecond: number) {
  return Math.min(bytesPerSecond, GRAPH_MAX_BYTES_PER_SECOND)
}

function mapGraphSpeedToHeight(bytesPerSecond: number) {
  return (clampGraphSpeed(bytesPerSecond) / GRAPH_MAX_BYTES_PER_SECOND) ** GRAPH_CURVE_EXPONENT
}

export function formatNetworkSpeed(bytesPerSecond: number) {
  if (bytesPerSecond >= 1_000_000) {
    const megabytesPerSecond = bytesPerSecond / 1_000_000
    const precision = megabytesPerSecond >= 10 ? 0 : 1

    return `${megabytesPerSecond.toFixed(precision)} MB/s`
  }

  return `${Math.round(bytesPerSecond / 1_000)} KB/s`
}

export function useNetworkTelemetry() {
  const [networkState, setNetworkState] = useState<NetworkState>('checking')
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const polylineRef = useRef<SVGPolylineElement>(null)
  const latestSampleRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    const checkNetwork = async () => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 4500)

      try {
        await fetch('https://www.google.com/generate_204', {
          cache: 'no-store',
          mode: 'no-cors',
          signal: controller.signal,
        })

        if (!cancelled) setNetworkState('online')
      } catch {
        if (!cancelled) setNetworkState('offline')
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    checkNetwork()
    const intervalId = window.setInterval(checkNetwork, 15000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!isTauri()) {
      latestSampleRef.current = 0
      return
    }

    let active = true
    let unlisten: UnlistenFn | undefined

    void listen<NetworkTrafficSample>(NETWORK_SAMPLE_EVENT, ({ payload }) => {
      const bytesLastSecond = Math.max(0, payload.bytesLastSecond)

      latestSampleRef.current = bytesLastSecond
      setCurrentSpeed(bytesLastSecond)
    })
      .then((cleanup) => {
        if (!active) {
          cleanup()
          return
        }

        unlisten = cleanup
      })
      .catch(() => {
        latestSampleRef.current = 0
        setCurrentSpeed(0)
      })

    return () => {
      active = false
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    if (networkState === 'online') return

    polylineRef.current?.setAttribute('points', '')
  }, [networkState])

  useEffect(() => {
    let lastTime = performance.now()
    let offset = 0
    let history = Array(HISTORY_LENGTH).fill(0)
    let animationFrameId = 0

    const tick = (time: number) => {
      if (networkState !== 'online') {
        polylineRef.current?.setAttribute('points', '')
        return
      }

      const delta = time - lastTime
      lastTime = time
      offset += (delta / 1000) * GRAPH_STEP

      if (offset >= GRAPH_STEP) {
        offset %= GRAPH_STEP
        history = [...history.slice(1), latestSampleRef.current]
      }

      polylineRef.current?.setAttribute(
        'points',
        history
          .map((value, index) => {
            const mappedHeight = mapGraphSpeedToHeight(value)

            return `${(index * GRAPH_STEP) - offset},${GRAPH_BASELINE_Y - mappedHeight * GRAPH_BASELINE_Y}`
          })
          .join(' '),
      )

      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [networkState])

  return { currentSpeed, currentSpeedLabel: formatNetworkSpeed(currentSpeed), networkState, polylineRef }
}
