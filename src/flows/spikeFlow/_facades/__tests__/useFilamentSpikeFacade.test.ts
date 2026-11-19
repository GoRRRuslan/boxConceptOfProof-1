import { act, renderHook } from '@testing-library/react-native'

import '@i18next/i18init'
import { useFilamentSpikeFacade } from '@flows/spikeFlow/_facades/useFilamentSpikeFacade'
import { LID_FULLY_OPEN_ANGLE_DEGREES } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

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

  it('toggles between one and four boxes', async () => {
    const { result } = await renderHook(() => useFilamentSpikeFacade())

    await act(() => {
      result.current.handleToggleModelCountPress()
    })

    expect(result.current.modelCount).toBe(4)

    await act(() => {
      result.current.handleToggleModelCountPress()
    })

    expect(result.current.modelCount).toBe(1)
  })
})
