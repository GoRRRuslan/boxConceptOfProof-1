import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { createElement, type ReactNode } from 'react'

import '@i18next/i18init'
import { LID_OPEN_DURATION_MILLISECONDS } from '@flows/openingFlow/_config/openingConfig'
import { useOpeningFacade } from '@flows/openingFlow/_facades/useOpeningFacade'
import { EOpeningPhase } from '@flows/openingFlow/_types'
import useStore from '@models/mainStorage/_storeConfigured'
import { resetAllSlices } from '@models/mainStorage/_storeConfigured/ResetterStore'
import { INITIAL_BALANCE_IN_CENTS } from '@models/mainStorage/WalletStore/initialState'
import MysteryBoxApi from '@networking/api/MysteryBoxApi'
import { mockApiSettings, resetMockApiSettings } from '@networking/api/MysteryBoxApi/_config/mockApiSettings'
import { BOX_CATALOGUE } from '@networking/api/MysteryBoxApi/_mockData/boxCatalogue'
import { WATCH_CATALOGUE } from '@networking/api/MysteryBoxApi/_mockData/watchCatalogue'
import { EBoxIdentifier, EMockFailureMode } from '@networking/api/MysteryBoxApi/_types'
import { hapticFeedback } from '@services/haptics/hapticFeedback'

const mockSceneStates: unknown[] = []

jest.mock('react-native-gesture-handler', () => ({ usePanGesture: (config: unknown) => config }))

jest.mock('@services/haptics/hapticFeedback', () => ({
  hapticFeedback: { success: jest.fn(), error: jest.fn(), lidOpening: jest.fn(), selection: jest.fn() },
}))

jest.mock('react-native-worklets', () => ({
  createSynchronizable: (initial: unknown) => {
    let value = initial

    return {
      getBlocking: () => value,
      setBlocking: (next: unknown) => {
        value = next

        mockSceneStates.push(next)
      },
    }
  },
}))

jest.mock('@assets/images/watches/full/casio.webp', () => 1, { virtual: true })

jest.mock('@assets/images/watches/full/gmt.webp', () => 2, { virtual: true })

jest.mock('@assets/images/watches/full/perpetual.webp', () => 3, { virtual: true })

jest.mock('@assets/images/watches/full/sky-dweller.webp', () => 4, { virtual: true })

const boxesData = { boxes: BOX_CATALOGUE, watches: WATCH_CATALOGUE }
const cards = BOX_CATALOGUE.map(box => ({ identifier: box.identifier }) as never)
const [starterBox, , , legendBox] = BOX_CATALOGUE

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } })

  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
}

const renderFacade = () => renderHook(() => useOpeningFacade({ boxesData, cards }), { wrapper: createWrapper() })

describe('useOpeningFacade', () => {
  beforeEach(() => {
    resetAllSlices()

    resetMockApiSettings()

    mockApiSettings.latencyInMilliseconds = 0

    // A fresh "server": purchase keys of earlier tests must not leak into this one.
    MysteryBoxApi.resetServer()

    mockSceneStates.length = 0

    jest.clearAllMocks()
  })

  it('starts browsing with no overlay', async () => {
    const { result } = await renderFacade()

    expect(result.current.phase).toBe(EOpeningPhase.Browsing)

    expect(result.current.isOverlayVisible).toBe(false)

    expect(result.current.primaryButton).toBeNull()
  })

  it('selecting a box centres it and offers to buy it', async () => {
    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Starter)
    })

    expect(result.current.phase).toBe(EOpeningPhase.Inspecting)

    expect(result.current.isListHidden).toBe(true)

    expect(result.current.boxNameText).toBe('Starter Box')

    expect(result.current.primaryButton?.labelText).toBe('Buy for $50')

    expect(result.current.primaryButton?.isDisabled).toBe(false)

    expect(hapticFeedback.selection).toHaveBeenCalled()
  })

  it('goes all the way: buy, open, reveal, done — one deduction and one watch', async () => {
    jest.useFakeTimers()

    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Starter)
    })

    await act(async () => {
      result.current.primaryButton?.onPress()

      await jest.advanceTimersByTimeAsync(50)
    })

    expect(result.current.phase).toBe(EOpeningPhase.Ready)

    expect(useStore.getState().balanceInCents).toBe(INITIAL_BALANCE_IN_CENTS - starterBox.priceInCents)

    expect(useStore.getState().ownedWatches).toHaveLength(1)

    expect(hapticFeedback.success).toHaveBeenCalled()

    expect(result.current.primaryButton?.labelText).toBe('Open the box')

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    expect(result.current.phase).toBe(EOpeningPhase.Opening)

    expect(result.current.primaryButton?.isDisabled).toBe(true)

    expect(hapticFeedback.lidOpening).toHaveBeenCalled()

    await act(async () => {
      await jest.advanceTimersByTimeAsync(LID_OPEN_DURATION_MILLISECONDS + 10)
    })

    expect(result.current.phase).toBe(EOpeningPhase.Revealed)

    expect(result.current.reveal?.nameText).toBe(useStore.getState().ownedWatches[0].watch.name)

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    expect(result.current.phase).toBe(EOpeningPhase.Browsing)

    // Opening and closing did not buy anything a second time.
    expect(useStore.getState().ownedWatches).toHaveLength(1)

    expect(useStore.getState().balanceInCents).toBe(INITIAL_BALANCE_IN_CENTS - starterBox.priceInCents)

    jest.useRealTimers()
  })

  it('a failed purchase changes nothing, explains why and allows another try', async () => {
    mockApiSettings.purchaseFailureMode = EMockFailureMode.ServerError

    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Starter)
    })

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    await waitFor(() => {
      expect(result.current.phase).toBe(EOpeningPhase.Inspecting)
    })

    expect(result.current.errorText).toContain('Nothing was charged')

    expect(useStore.getState().balanceInCents).toBe(INITIAL_BALANCE_IN_CENTS)

    expect(useStore.getState().ownedWatches).toEqual([])

    expect(hapticFeedback.error).toHaveBeenCalled()

    mockApiSettings.purchaseFailureMode = EMockFailureMode.None

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    await waitFor(() => {
      expect(result.current.phase).toBe(EOpeningPhase.Ready)
    })

    expect(result.current.errorText).toBeNull()

    expect(useStore.getState().ownedWatches).toHaveLength(1)
  })

  it('a box the balance cannot pay for cannot be bought', async () => {
    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Legend)
    })

    expect(result.current.primaryButton?.isDisabled).toBe(true)

    expect(result.current.hintText).toBe('Not enough balance')

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    expect(result.current.phase).toBe(EOpeningPhase.Inspecting)

    expect(useStore.getState().balanceInCents).toBe(INITIAL_BALANCE_IN_CENTS)

    expect(legendBox.priceInCents).toBeGreaterThan(INITIAL_BALANCE_IN_CENTS)
  })

  it('may go back before buying, and cannot select a second box while one is open', async () => {
    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Starter)
    })

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Classic)
    })

    expect(result.current.boxNameText).toBe('Starter Box')

    await act(() => {
      result.current.handleBackPress()
    })

    expect(result.current.phase).toBe(EOpeningPhase.Browsing)

    expect(result.current.isOverlayVisible).toBe(false)
  })

  it('tells the 3D scene which card is opened and starts the lid', async () => {
    const { result } = await renderFacade()

    await act(() => {
      result.current.handleCardPress(EBoxIdentifier.Elite)
    })

    expect(result.current.sceneState.getBlocking()).toMatchObject({ focusedCardIndex: 2, focusTarget: 1, lidTarget: 0 })

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    await waitFor(() => {
      expect(result.current.phase).toBe(EOpeningPhase.Ready)
    })

    await act(() => {
      result.current.primaryButton?.onPress()
    })

    expect(result.current.sceneState.getBlocking()).toMatchObject({ lidTarget: 1 })
  })
})
