import { useEffect, useRef, useState } from 'react'

export type NetworkState = 'checking' | 'online' | 'offline'

const HISTORY_LENGTH = 22
const MAX_SPEED = 2000

function getRandomSpeed() {
  return Math.floor(Math.random() * MAX_SPEED)
}

export function useNetworkTelemetry() {
  const [networkState, setNetworkState] = useState<NetworkState>('checking')
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const polylineRef = useRef<SVGPolylineElement>(null)

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
    if (networkState === 'online') return

    polylineRef.current?.setAttribute('points', '')
  }, [networkState])

  useEffect(() => {
    let lastTime = performance.now()
    let offset = 0
    let history = Array(HISTORY_LENGTH).fill(0)
    let nextValue = getRandomSpeed()
    let animationFrameId = 0

    const tick = (time: number) => {
      if (networkState !== 'online') {
        polylineRef.current?.setAttribute('points', '')
        return
      }

      const delta = time - lastTime
      lastTime = time
      offset += (delta / 1000) * 5

      if (offset >= 5) {
        offset %= 5
        history = [...history.slice(1), nextValue]
        setCurrentSpeed(nextValue)
        nextValue = getRandomSpeed()
      }

      polylineRef.current?.setAttribute(
        'points',
        history
          .map((value, index) => `${(index * 5) - offset},${100 - (value / MAX_SPEED) * 100}`)
          .join(' '),
      )

      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [networkState])

  return { networkState, currentSpeed, polylineRef }
}
