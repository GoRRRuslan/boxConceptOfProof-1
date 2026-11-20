import { act, renderHook } from '@testing-library/react-native'

import '@i18next/i18init'
import { useFilamentSpikeFacade } from '@flows/spikeFlow/_facades/useFilamentSpikeFacade'
import { LID_FULLY_OPEN_ANGLE_DEGREES } from '@services/filament/computeLidHingeTransform'

jest.mock('@services/performance/useRenderFpsMeter', () => ({
  useRenderFpsMeter: () => ({ renderCallback: jest.fn(), renderFrameStats: null, isRenderPaused: false }),
}))

describe('useFilamentSpikeFacade', () => {
  it('starts with a closed lid and a single box', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())

    expect(result.current.modelCount).toBe(1)

    expect(result.current.angleLabelText).toBe('0°')

    expect(result.current.lidHingeTransform.rotate[0]).toBeCloseTo(0)
  })

  it('opens the lid to the fully open angle and closes it again', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())

    await act(() => {
      result.current.handleOpenPress()
    })

    expect(result.current.angleLabelText).toBe(`${LID_FULLY_OPEN_ANGLE_DEGREES}°`)

    await act(() => {
      result.current.handleClosePress()
    })

    expect(result.current.angleLabelText).toBe('0°')
  })

  it('never goes below 0° or above the fully open angle when stepping', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())

    await act(() => {
      result.current.handleDecreasePress()
    })

    expect(result.current.angleLabelText).toBe('0°')

    await act(() => {
      result.current.handleOpenPress()
    })

    await act(() => {
      result.current.handleIncreasePress()
    })

    expect(result.current.angleLabelText).toBe(`${LID_FULLY_OPEN_ANGLE_DEGREES}°`)
  })

  it('cycles through the benchmark box counts and wraps around', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())
    const observedCounts: number[] = [result.current.modelCount]

    for (let pressIndex = 0; pressIndex < 4; pressIndex += 1) {
      await act(() => {
        result.current.handleToggleModelCountPress()
      })

      observedCounts.push(result.current.modelCount)
    }

    expect(observedCounts).toEqual([1, 4, 16, 64, 1])
  })

  it('cycles through the render quality profiles', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())

    expect(result.current.qualityLabelText).toBe('Quality: full')

    await act(() => {
      result.current.handleCycleQualityPress()
    })

    expect(result.current.qualityLabelText).toBe('Quality: balanced')
  })

  it('runs a continuous lid animation while the benchmark is on and stops when it is off', async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useFilamentSpikeFacade())

    await act(() => {
      result.current.handleToggleBenchmarkPress()
    })

    expect(result.current.benchmarkLabelText).toBe('Benchmark: ON')

    await act(() => {
      jest.advanceTimersByTime(1500)
    })

    const midAngleLabel = result.current.angleLabelText

    expect(midAngleLabel).not.toBe('0°')

    await act(() => {
      result.current.handleToggleBenchmarkPress()
    })

    const stoppedAngleLabel = result.current.angleLabelText

    await act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.angleLabelText).toBe(stoppedAngleLabel)

    jest.useRealTimers()
  })
})
