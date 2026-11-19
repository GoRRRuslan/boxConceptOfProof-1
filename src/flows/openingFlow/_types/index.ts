import type { ImageSourcePropType } from 'react-native'
import type { usePanGesture } from 'react-native-gesture-handler'
import type { Synchronizable } from 'react-native-worklets'

import type { EBoxIdentifier } from '@networking/api/MysteryBoxApi/_types'

export enum EOpeningPhase {
  // The list is shown, no box is selected.
  Browsing = 'browsing',
  // A box is centred; the user can turn it and decide to buy.
  Inspecting = 'inspecting',
  // The purchase request is running.
  Purchasing = 'purchasing',
  // Bought (balance deducted, watch owned); waiting for the user to open it.
  Ready = 'ready',
  // The lid is opening.
  Opening = 'opening',
  // The lid is open and the watch is shown.
  Revealed = 'revealed',
}

// Stable string of the phase, used as a cache/activity key.
export type IOpeningPhaseKey = `${EOpeningPhase}`

export enum EOpeningEvent {
  BoxSelected = 'boxSelected',
  PurchasePressed = 'purchasePressed',
  PurchaseSucceeded = 'purchaseSucceeded',
  PurchaseFailed = 'purchaseFailed',
  OpenPressed = 'openPressed',
  LidOpened = 'lidOpened',
  ClosePressed = 'closePressed',
}

// What the 3D scene needs to know about the opening, written by React, read on every frame.
export interface IOpeningSceneState {
  // Index of the card whose box is opened/centred; -1 when none.
  focusedCardIndex: number
  focusTarget: 0 | 1
  focusFromProgress: number
  focusStartedAtMilliseconds: number
  lidTarget: 0 | 1
  lidFromProgress: number
  lidStartedAtMilliseconds: number
}

// Rotation of the focused box by the user's finger, with inertia after release.
export interface IDragState {
  yawRadians: number
  pitchRadians: number
  yawVelocityRadiansPerSecond: number
  pitchVelocityRadiansPerSecond: number
  isDragging: boolean
}

export interface IOpeningPose {
  isVisible: boolean
  scale: number
  yawRadians: number
  pitchRadians: number
  translateY: number
}

export enum EOpeningPrimaryAction {
  Buy = 'buy',
  Open = 'open',
  Done = 'done',
}

export interface IOpeningPrimaryButton {
  labelText: string
  isDisabled: boolean
  testID: string
  onPress: () => void
}

export interface IOpeningReveal {
  titleText: string
  nameText: string
  brandText: string
  valueText: string
  imageSource: ImageSourcePropType
}

export interface IOpeningFacade {
  phase: EOpeningPhase
  isOverlayVisible: boolean
  isListHidden: boolean
  isDragging: boolean
  boxNameText: string
  priceText: string
  hintText: string
  errorText: string | null
  backLabelText: string
  isBackVisible: boolean
  primaryButton: IOpeningPrimaryButton | null
  reveal: IOpeningReveal | null
  panGesture: ReturnType<typeof usePanGesture>
  sceneState: Synchronizable<IOpeningSceneState>
  dragState: Synchronizable<IDragState>
  handleCardPress: (boxIdentifier: EBoxIdentifier) => void
  handleBackPress: () => void
}
