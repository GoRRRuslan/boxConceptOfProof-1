import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { createElement, type ReactNode } from 'react'
import { Alert } from 'react-native'

import '@i18next/i18init'
import { useCatalogueFacade } from '@flows/catalogueFlow/_facades/useCatalogueFacade'
import { INITIAL_BALANCE_IN_CENTS } from '@models/mainStorage/WalletStore/initialState'
import useStore from '@models/mainStorage/_storeConfigured'
import { resetAllSlices } from '@models/mainStorage/_storeConfigured/ResetterStore'
import { mockApiSettings, resetMockApiSettings } from '@networking/api/MysteryBoxApi/_config/mockApiSettings'
import { BOX_CATALOGUE } from '@networking/api/MysteryBoxApi/_mockData/boxCatalogue'

const mockSetBlocking = jest.fn()
const mockSetParams = jest.fn()

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ setParams: mockSetParams, addListener: () => () => undefined }) }))

// A short wait for the scene, so that the timeout case can be tested without waiting 8 s.
jest.mock('@flows/catalogueFlow/_config/sceneRenderConfig', () => ({
  ...jest.requireActual<Record<string, unknown>>('@flows/catalogueFlow/_config/sceneRenderConfig'),
  SCENE_READY_TIMEOUT_MILLISECONDS: 400,
}))

jest.mock('react-native-gesture-handler', () => ({
  usePanGesture: () => ({}),
  usePinchGesture: () => ({}),
  useTapGesture: () => ({}),
  useLongPressGesture: () => ({}),
  useSimultaneousGestures: () => ({}),
}))

jest.mock('expo-sensors', () => ({
  DeviceMotion: { isAvailableAsync: () => Promise.resolve(false), setUpdateInterval: jest.fn(), addListener: jest.fn() },
}))

jest.mock('@services/sounds/soundEffects', () => ({
  ESoundEffect: {},
  soundEffects: { play: jest.fn(), prepare: jest.fn() },
}))

jest.mock('@services/haptics/hapticFeedback', () => ({
  hapticFeedback: {
    success: jest.fn(),
    error: jest.fn(),
    lidOpening: jest.fn(),
    selection: jest.fn(),
    anticipation: jest.fn(),
    rarityReveal: jest.fn(),
  },
}))

jest.mock('react-native-worklets', () => ({
  createSynchronizable: (initial: unknown) => {
    let value = initial

    return {
      getBlocking: () => value,
      setBlocking: (next: unknown) => {
        value = next

        mockSetBlocking(next)
      },
    }
  },
  scheduleOnRN: (callback: (...parameters: unknown[]) => void, ...parameters: unknown[]) => {
    callback(...parameters)
  },
}))

// The scroll handler is handed back as the plain object of its worklets, so that the cases can call them.
jest.mock('react-native-reanimated', () => ({
  useAnimatedScrollHandler: (handlers: unknown) => handlers,
}))

jest.mock('@services/performance/useRenderFpsMeter', () => ({
  useRenderFpsMeter: () => ({ renderCallback: jest.fn(), renderFrameStats: null, isRenderPaused: false }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })

  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

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

  it('is not ready until the 3D scene says so, then is', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(BOX_CATALOGUE.length)
    })

    // The boxes are loaded, but the scene has not reported: still not ready.
    expect(result.current.isSceneReady).toBe(false)

    await act(() => {
      result.current.sceneSync.sceneReadiness.setBlocking(true)
    })

    await waitFor(() => {
      expect(result.current.isSceneReady).toBe(true)
    })
  })

  it('stops waiting for a scene that never gets ready', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(BOX_CATALOGUE.length)
    })

    expect(result.current.isSceneReady).toBe(false)

    await waitFor(
      () => {
        expect(result.current.isSceneReady).toBe(true)
      },
      { timeout: 2000 },
    )
  })

  it('keeps the tab bar while the list is shown', async () => {
    await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(mockSetParams).toHaveBeenCalledWith({ isTabBarHidden: false })

    expect(mockSetParams).not.toHaveBeenCalledWith({ isTabBarHidden: true })
  })

  it('resets the balance to the starting one after a confirmation, and keeps it when nothing is confirmed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await act(() => {
      useStore.setState({ balanceInCents: 12_300 })
    })

    await act(() => {
      result.current.handleResetBalancePress()
    })

    const buttons = alertSpy.mock.calls[0]?.[2] ?? []

    expect(useStore.getState().balanceInCents).toBe(12_300)

    await act(() => {
      buttons.find(button => button.style === 'destructive')?.onPress?.()
    })

    expect(useStore.getState().balanceInCents).toBe(INITIAL_BALANCE_IN_CENTS)

    alertSpy.mockRestore()
  })

  it('exposes the wallet balance in cents and follows it', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(result.current.balanceInCents).toBe(100_000)

    await act(() => {
      useStore.setState({ balanceInCents: 55_000 })
    })

    expect(result.current.balanceInCents).toBe(55_000)
  })

  interface IScrollHandlers {
    onScroll: (event: { contentOffset: { y: number } }) => void
    onBeginDrag: () => void
    onEndDrag: () => void
    onMomentumBegin: () => void
    onMomentumEnd: () => void
  }

  const getScrollHandlers = (result: { current: { scrollHandler: unknown } }) => result.current.scrollHandler as IScrollHandlers

  it('writes the scroll offset for the 3D scene (on the UI thread, no state involved)', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    getScrollHandlers(result).onScroll({ contentOffset: { y: 240 } })

    expect(mockSetBlocking).toHaveBeenCalledWith(240)
  })

  it('reports scrolling from the start of a drag until the fling is over and a moment has passed', async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await act(() => {
      getScrollHandlers(result).onBeginDrag()
    })

    expect(result.current.isRenderContinuous).toBe(true)

    await act(() => {
      getScrollHandlers(result).onEndDrag()

      getScrollHandlers(result).onMomentumBegin()
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isRenderContinuous).toBe(true)

    await act(async () => {
      getScrollHandlers(result).onMomentumEnd()

      await jest.advanceTimersByTimeAsync(300)
    })

    expect(result.current.isRenderContinuous).toBe(false)

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

  it('squeezes the pressed box until the finger lifts', async () => {
    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.cards.length).toBeGreaterThan(0)
    })

    await act(() => {
      result.current.handleCardPressIn(BOX_CATALOGUE[2].identifier)
    })

    expect(result.current.sceneSync.pressState.getBlocking()).toMatchObject({ cardIndex: 2, isPressed: true })

    await act(() => {
      result.current.handleCardPressOut()
    })

    expect(result.current.sceneSync.pressState.getBlocking()).toMatchObject({ cardIndex: 2, isPressed: false })
  })

  it('keeps the renderer busy while a card is pressed and until the box has bounced back', async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useCatalogueFacade(), { wrapper: createWrapper() })

    expect(result.current.isRenderContinuous).toBe(false)

    await act(() => {
      result.current.handleCardPressIn(BOX_CATALOGUE[0].identifier)
    })

    expect(result.current.isRenderContinuous).toBe(true)

    await act(() => {
      result.current.handleCardPressOut()
    })

    expect(result.current.isRenderContinuous).toBe(true)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400)
    })

    expect(result.current.isRenderContinuous).toBe(false)

    jest.useRealTimers()
  })
})
