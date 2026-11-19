import type { FlashListRef } from '@shopify/flash-list'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { createSynchronizable } from 'react-native-worklets'

import { CARD_HEIGHT, LIST_TOP_PADDING } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import { useAdapterCatalogueCards } from '@flows/catalogueFlow/_adapters/useAdapterCatalogueCards'
import { useOpeningFacade } from '@flows/openingFlow/_facades/useOpeningFacade'
import { EOpeningPhase } from '@flows/openingFlow/_types'
import type { ICatalogueCard, ICatalogueFacade, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import useStore from '@models/mainStorage/_storeConfigured'
import { useGetBoxesQuery } from '@networking/requests/queries/BoxQueries/useGetBoxesQuery'
import { useRenderFpsMeter } from '@services/performance/useRenderFpsMeter'
import { formatCurrency } from '@utils/formatCurrency'

// The list counts as "scrolling" until this long after its last scroll event (covers the fling).
const SCROLL_IDLE_MILLISECONDS = 250
// Measurement builds show the live frame-rate overlay: EXPO_PUBLIC_SHOW_PERFORMANCE=1
const IS_PERFORMANCE_OVERLAY_VISIBLE = process.env.EXPO_PUBLIC_SHOW_PERFORMANCE === '1'
// Measurement builds can scroll the list up and down by themselves: EXPO_PUBLIC_AUTO_SCROLL=1
const IS_AUTO_SCROLL = process.env.EXPO_PUBLIC_AUTO_SCROLL === '1'
const AUTO_SCROLL_SWEEP_MILLISECONDS = 2400
const AUTO_SCROLL_TICK_MILLISECONDS = 16
const PERFORMANCE_SCENARIO_LABEL = IS_AUTO_SCROLL ? 'catalogue-scroll' : 'catalogue'

export const useCatalogueFacade = (): ICatalogueFacade => {
  const { t } = useTranslation()

  // ------------------------ Services ----------------------- //
  const { renderCallback, renderFrameStats, isRenderPaused } = useRenderFpsMeter(PERFORMANCE_SCENARIO_LABEL)

  // --------------------------- State ------------------------- //
  const [viewport, setViewport] = useState<ICatalogueViewport | null>(null)
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const listRef = useRef<FlashListRef<ICatalogueCard> | null>(null)
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // --------------------------- Store ------------------------- //
  const balanceInCents = useStore(state => state.balanceInCents)

  // ----------------------- Queries / mutations -------------------- //
  const { boxesData, boxesRefetch, isLoadingBoxes, isErrorBoxes } = useGetBoxesQuery()

  // -------------------------- Adapter ------------------------- //
  const cards = useAdapterCatalogueCards({ boxesData, balanceInCents })

  // ------------------------- Opening -------------------------- //
  const opening = useOpeningFacade({ boxesData, cards })

  // -------------------------- Values ------------------------- //
  // Shared with the 3D scene: written on every scroll event, read on every rendered frame.
  const scrollOffset = useMemo(() => createSynchronizable(0), [])
  const isRenderContinuous =
    isScrolling || opening.isDragging || [EOpeningPhase.Inspecting, EOpeningPhase.Purchasing, EOpeningPhase.Ready, EOpeningPhase.Opening].includes(opening.phase)
  const balanceText = useMemo(() => formatCurrency(balanceInCents), [balanceInCents])

  // ------------------- Handlers -------------------------- //
  const handleListLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout

    setViewport(previous => (previous?.width === width && previous.height === height ? previous : { width, height }))
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.setBlocking(event.nativeEvent.contentOffset.y)

    setIsScrolling(true)

    clearTimeout(scrollIdleTimer.current)

    scrollIdleTimer.current = setTimeout(() => {
      setIsScrolling(false)
    }, SCROLL_IDLE_MILLISECONDS)
  }

  const handleRetryPress = () => {
    void boxesRefetch()
  }

  // ------------------- Side effects ----------------------- //
  useEffect(() => {
    if (!IS_AUTO_SCROLL || !viewport || cards.length === 0) {
      return
    }

    // Triangle wave between the top and the bottom of the list: a steady, repeatable scroll workload.
    const maximumOffset = LIST_TOP_PADDING + cards.length * CARD_HEIGHT - viewport.height
    const startedAt = Date.now()
    const autoScrollTimer = setInterval(() => {
      const phase = ((Date.now() - startedAt) / AUTO_SCROLL_SWEEP_MILLISECONDS) % 1
      const wave = phase < 0.5 ? phase * 2 : 2 - phase * 2

      listRef.current?.scrollToOffset({ offset: wave * maximumOffset, animated: false })
    }, AUTO_SCROLL_TICK_MILLISECONDS)

    return () => {
      clearInterval(autoScrollTimer)
    }
  }, [viewport, cards.length])

  useEffect(
    () => () => {
      clearTimeout(scrollIdleTimer.current)
    },
    [],
  )

  return {
    titleText: t('catalogue.title'),
    balanceLabelText: t('catalogue.balanceLabel'),
    balanceText,
    loadingText: t('catalogue.loading'),
    errorText: t('catalogue.error'),
    retryLabelText: t('catalogue.retry'),
    isLoadingBoxes,
    isErrorBoxes,
    cards,
    viewport,
    listRef,
    scrollOffset,
    opening,
    phaseKey: opening.phase,
    isRenderContinuous,
    isPerformanceOverlayVisible: IS_PERFORMANCE_OVERLAY_VISIBLE,
    renderCallback,
    renderFrameStats,
    isRenderPaused,
    handleListLayout,
    handleScroll,
    handleRetryPress,
  }
}
