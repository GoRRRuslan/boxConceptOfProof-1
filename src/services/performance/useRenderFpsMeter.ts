import { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import type { FrameInfo } from 'react-native-filament'
import { scheduleOnRN } from 'react-native-worklets'

import { type IRenderFrameStats, summarizeFrameDeltas } from '@services/performance/summarizeFrameDeltas'

interface IFpsAccumulator {
  windowStartNanoseconds: number
  frameDeltasMilliseconds: number[]
}

declare global {
  // Lives on the Filament worklet runtime; one accumulator per runtime.
  var __renderFpsAccumulator: IFpsAccumulator | undefined
}

const REPORT_WINDOW_NANOSECONDS = 1_000_000_000

// Measures the real renderer frame rate: it counts the callbacks Filament's choreographer fires
// (one per rendered frame) and reports a summary roughly once per second.
export const useRenderFpsMeter = () => {
  const [renderFrameStats, setRenderFrameStats] = useState<IRenderFrameStats | null>(null)

  const handleReportStats = useCallback((stats: IRenderFrameStats) => {
    console.info(`[perf:${Platform.OS}] ${JSON.stringify(stats)}`)

    setRenderFrameStats(stats)
  }, [])

  const renderCallback = useCallback(
    (frameInfo: FrameInfo) => {
      'worklet'

      // The very first callback reports the time since the engine started, not a frame duration: skip it.
      if (!globalThis.__renderFpsAccumulator) {
        globalThis.__renderFpsAccumulator = {
          windowStartNanoseconds: frameInfo.timestamp,
          frameDeltasMilliseconds: [],
        }

        return
      }

      const accumulator = globalThis.__renderFpsAccumulator

      accumulator.frameDeltasMilliseconds.push(frameInfo.timeSinceLastFrame * 1000)

      if (frameInfo.timestamp - accumulator.windowStartNanoseconds < REPORT_WINDOW_NANOSECONDS) {
        return
      }

      const stats = summarizeFrameDeltas(accumulator.frameDeltasMilliseconds)

      globalThis.__renderFpsAccumulator = {
        windowStartNanoseconds: frameInfo.timestamp,
        frameDeltasMilliseconds: [],
      }

      scheduleOnRN(handleReportStats, stats)
    },
    [handleReportStats],
  )

  return { renderCallback, renderFrameStats }
}
