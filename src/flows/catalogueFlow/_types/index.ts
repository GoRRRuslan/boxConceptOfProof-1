import type { FlashListRef } from '@shopify/flash-list'
import type { RefObject } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import type { FrameInfo } from 'react-native-filament'
import type { Synchronizable } from 'react-native-worklets'

import type { IOpeningFacade, IOpeningPhaseKey } from '@flows/openingFlow/_types'
import type { EBoxIdentifier } from '@networking/api/MysteryBoxApi/_types'
import type { IRenderFrameStats } from '@services/performance/summarizeFrameDeltas'

// Linear RGBA, each channel 0..1.
export type TColorRgba = [number, number, number, number]

export interface ICatalogueCard {
  identifier: EBoxIdentifier
  name: string
  priceText: string
  prizeText: string
  // Shown only when the balance is too low for this box; null otherwise.
  affordabilityText: string | null
  isAffordable: boolean
  colorLinearRgba: TColorRgba
}

export interface ICatalogueViewport {
  width: number
  height: number
}

export interface ICatalogueFacade {
  titleText: string
  balanceLabelText: string
  balanceText: string
  loadingText: string
  errorText: string
  retryLabelText: string
  isLoadingBoxes: boolean
  isErrorBoxes: boolean
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport | null
  listRef: RefObject<FlashListRef<ICatalogueCard> | null>
  // Written by the list on every scroll event, read by the 3D scene on every frame.
  scrollOffset: Synchronizable<number>
  opening: IOpeningFacade
  phaseKey: IOpeningPhaseKey
  // True while anything moves (scroll, drag, opening): the renderer must keep drawing.
  isRenderContinuous: boolean
  isPerformanceOverlayVisible: boolean
  renderCallback: (frameInfo: FrameInfo) => void
  renderFrameStats: IRenderFrameStats | null
  isRenderPaused: boolean
  handleListLayout: (event: LayoutChangeEvent) => void
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  handleRetryPress: () => void
}
