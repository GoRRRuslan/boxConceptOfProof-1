import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { createElement, type ReactNode } from 'react'

import '@i18next/i18init'
import { useCatalogueFacade } from '@flows/catalogueFlow/_facades/useCatalogueFacade'
import useStore from '@models/mainStorage/_storeConfigured'
import { resetAllSlices } from '@models/mainStorage/_storeConfigured/ResetterStore'
import { mockApiSettings, resetMockApiSettings } from '@networking/api/MysteryBoxApi/_config/mockApiSettings'
import { BOX_CATALOGUE } from '@networking/api/MysteryBoxApi/_mockData/boxCatalogue'

const mockSetBlocking = jest.fn()

jest.mock('react-native-gesture-handler', () => ({ usePanGesture: () => ({}) }))

jest.mock('@services/haptics/hapticFeedback', () => ({
  hapticFeedback: { success: jest.fn(), error: jest.fn(), lidOpening: jest.fn(), selection: jest.fn() },
}))

jest.mock('react-native-worklets', () => ({
  createSynchronizable: () => ({ setBlocking: mockSetBlocking, getBlocking: () => 0 }),
  scheduleOnRN: jest.fn(),
}))

jest.mock('@services/performance/useRenderFpsMeter', () => ({
  useRenderFpsMeter: () => ({ renderCallback: jest.fn(), renderFrameStats: null, isRenderPaused: false }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })

  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

const scrollEvent = (offsetY: number) => ({ nativeEvent: { contentOffset: { y: offsetY } } }) as never

describe('useCatalogueFacade', () => {
  beforeEach(() => {
    resetAllSlices()

    resetMockApiSettings()

    mockApiSettings.latencyInMilliseconds = 0

    mockSetBlocking.mockClear()
  })

  it('loads the boxes and builds one card per box', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(result.current.isLoadingBoxes).toBe(true)

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(BOX_CATALOGUE.length)
    })

    expect(result.current.isLoadingBoxes).toBe(false)
  })

  it('shows the wallet balance and follows it', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(result.current.balanceText).toBe('$1,000')

    await act(() => {
      useStore.setState({ balanceInCents: 55_000 })
    })

    expect(result.current.balanceText).toBe('$550')
  })

  it('writes the scroll offset for the 3D scene and reports scrolling until the list is idle', async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await act(() => {
      result.current.handleScroll(scrollEvent(240))
    })

    expect(mockSetBlocking).toHaveBeenCalledWith(240)

    expect(result.current.isRenderContinuous).toBe(true)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(300)
    })

    expect(result.current.isRenderContinuous).toBe(false)

    jest.useRealTimers()
  })

  it('keeps reporting scrolling while scroll events keep arriving', async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    for (const offset of [10, 20, 30, 40]) {
      await act(async () => {
        result.current.handleScroll(scrollEvent(offset))

        await jest.advanceTimersByTimeAsync(100)
      })
    }

    expect(result.current.isRenderContinuous).toBe(true)

    jest.useRealTimers()
  })

  it('stores the viewport size reported by the list layout', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(result.current.viewport).toBeNull()

    await act(() => {
      result.current.handleListLayout({ nativeEvent: { layout: { width: 390, height: 640, x: 0, y: 0 } } } as never)
    })

    expect(result.current.viewport).toEqual({ width: 390, height: 640 })
  })
})
