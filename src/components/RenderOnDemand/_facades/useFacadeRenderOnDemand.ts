import { useEffect, useRef } from 'react'
import { RenderCallbackContext, useFilamentContext } from 'react-native-filament'
import { runOnRuntimeAsync } from 'react-native-worklets'

interface IUseFacadeRenderOnDemandParams {
  activityKey: string
  warmupKey: string
  warmupMilliseconds: number
  minimumMilliseconds: number
  minimumFrames: number
  maximumMilliseconds: number
  isContinuous: boolean
}

declare global {
  // Rendered-frame counter; lives on (and is only touched from) the Filament worklet runtime.
  var __renderOnDemandFrameCount: number | undefined
}

const FRAME_POLL_INTERVAL_MILLISECONDS = 120
// Android's FilamentChoreographer.stop() cannot cancel the frame callback that is already queued
// (it removes a different lambda instance), so stop() followed by start() within one frame leaves two
// frame loops running forever and multiplies the frame rate. Keep stop() and the next start() apart.
const MINIMUM_RESTART_GAP_MILLISECONDS = 300

// Filament's choreographer renders every display refresh, even for a static scene. This keeps it
// running only while something changes: it is (re)started whenever `activityKey` changes and
// stopped after ENOUGH FRAMES HAVE ACTUALLY BEEN RENDERED since then (and a minimum time).
//
// Why frames and not just a timer: after an update the scene needs several frames before the
// final picture is on screen (queued transform/material jobs, the first presented buffer of a
// TextureView, slow devices at 5 fps...). A fixed timer froze half-updated or blank scenes on slow
// hardware; counting rendered frames adapts to the real frame rate. `maximumMilliseconds` is a
// safety cap so rendering cannot stay on forever. `warmupKey` marks changes after which the first
// frames are not yet representative (model finished loading): those get a longer window.
// The last frame stays on screen while stopped.
export const useFacadeRenderOnDemand = ({
  activityKey,
  warmupKey,
  warmupMilliseconds,
  minimumMilliseconds,
  minimumFrames,
  maximumMilliseconds,
  isContinuous,
}: IUseFacadeRenderOnDemandParams) => {
  const { choreographer, workletRuntime } = useFilamentContext()
  const lastWarmupKey = useRef<string | null>(null)
  // FilamentView starts the choreographer itself once the surface is ready, so assume it is running.
  const isChoreographerRunning = useRef<boolean>(true)
  const lastStopTimestamp = useRef<number>(0)

  // ------------------- Side effects ----------------------- //
  RenderCallbackContext.useRenderCallback(() => {
    'worklet'

    globalThis.__renderOnDemandFrameCount = (globalThis.__renderOnDemandFrameCount ?? 0) + 1
  }, [])

  useEffect(() => {
    // When the warm-up key changed (first mount, a model finished loading...) the first frames are
    // spent compiling shaders and applying queued updates and look empty, so keep rendering longer.
    const isWarmingUp = lastWarmupKey.current !== warmupKey
    const requiredMilliseconds = isWarmingUp ? Math.max(warmupMilliseconds, minimumMilliseconds) : minimumMilliseconds
    let isCancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined

    lastWarmupKey.current = warmupKey

    // Never call start() on a running choreographer: on Android every extra start() adds another
    // frame-callback loop (frames per second multiply and never come back down).
    let startTimer: ReturnType<typeof setTimeout> | undefined

    if (!isChoreographerRunning.current) {
      const remainingGapMilliseconds = Math.max(0, MINIMUM_RESTART_GAP_MILLISECONDS - (Date.now() - lastStopTimestamp.current))

      startTimer = setTimeout(() => {
        if (!isChoreographerRunning.current) {
          choreographer.start()

          isChoreographerRunning.current = true
        }
      }, remainingGapMilliseconds)
    }

    const readFrameCountAsync = () =>
      runOnRuntimeAsync(workletRuntime, () => {
        'worklet'

        return globalThis.__renderOnDemandFrameCount ?? 0
      })

    const stopWhenEnoughFramesAsync = async () => {
      const baselineFrameCount = await readFrameCountAsync()
      const startedAt = Date.now()

      const pollAsync = async () => {
        if (isCancelled) {
          return
        }

        const framesSinceActivity = (await readFrameCountAsync()) - baselineFrameCount
        const elapsedMilliseconds = Date.now() - startedAt
        const isEnough = framesSinceActivity >= minimumFrames && elapsedMilliseconds >= requiredMilliseconds

        if (isCancelled) {
          return
        }

        if (isEnough || elapsedMilliseconds >= maximumMilliseconds) {
          choreographer.stop()

          isChoreographerRunning.current = false

          lastStopTimestamp.current = Date.now()

          return
        }

        pollTimer = setTimeout(() => {
          void pollAsync()
        }, FRAME_POLL_INTERVAL_MILLISECONDS)
      }

      await pollAsync()
    }

    // Continuous scenes (benchmark, running animation) never stop: no stop/start churn at all.
    if (!isContinuous) {
      void stopWhenEnoughFramesAsync()
    }

    return () => {
      isCancelled = true

      clearTimeout(pollTimer)

      clearTimeout(startTimer)
    }
  }, [
    choreographer,
    workletRuntime,
    activityKey,
    warmupKey,
    warmupMilliseconds,
    minimumMilliseconds,
    minimumFrames,
    maximumMilliseconds,
    isContinuous,
  ])
}
