import type { TFunction } from 'i18next'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePanGesture } from 'react-native-gesture-handler'
import { createSynchronizable } from 'react-native-worklets'

import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import {
  DRAG_RADIANS_PER_PIXEL,
  FOCUS_DURATION_MILLISECONDS,
  LID_OPEN_DURATION_MILLISECONDS,
} from '@flows/openingFlow/_config/openingConfig'
import { WATCH_IMAGE_SOURCES } from '@utils/watchImageSources'
import { getPrimaryActionForPhase } from '@flows/openingFlow/_facadesLogic/getPrimaryActionForPhase'
import {
  INITIAL_OPENING_SCENE_STATE,
  startClose,
  startFocus,
  startLidOpen,
} from '@flows/openingFlow/_facadesLogic/openingSceneState'
import { transitionOpeningPhase } from '@flows/openingFlow/_facadesLogic/openingPhaseMachine'
import { INITIAL_DRAG_STATE, applyDragMovement } from '@flows/openingFlow/_facadesLogic/stepDragInertia'
import {
  EOpeningEvent,
  EOpeningPhase,
  EOpeningPrimaryAction,
  type IDragState,
  type IOpeningFacade,
  type IOpeningPrimaryButton,
  type IOpeningReveal,
  type IOpeningSceneState,
} from '@flows/openingFlow/_types'
import useStore from '@models/mainStorage/_storeConfigured'
import type { EBoxIdentifier, EPurchaseErrorCode, IGetBoxesResponse, IWatch } from '@networking/api/MysteryBoxApi/_types'
import { EBoxPurchaseResultStatus } from '@networking/requests/mutations/PurchaseMutations/_logic/runBoxPurchase'
import { usePostPurchaseBoxMutation } from '@networking/requests/mutations/PurchaseMutations/usePostPurchaseBoxMutation'
import { hapticFeedback } from '@services/haptics/hapticFeedback'
import { formatCurrency } from '@utils/formatCurrency'

interface IUseOpeningFacadeParams {
  boxesData: IGetBoxesResponse | undefined
  cards: ICatalogueCard[]
}

const INTERACTIVE_PHASES = [EOpeningPhase.Inspecting, EOpeningPhase.Ready, EOpeningPhase.Revealed]

// Opening experience of one box on top of the catalogue: select -> inspect -> buy -> open -> reveal.
export const useOpeningFacade = ({ boxesData, cards }: IUseOpeningFacadeParams): IOpeningFacade => {
  const { t } = useTranslation()

  // --------------------------- State ------------------------- //
  const [phase, dispatchEvent] = useReducer(transitionOpeningPhase, EOpeningPhase.Browsing)
  const [selectedBoxIdentifier, setSelectedBoxIdentifier] = useState<EBoxIdentifier | null>(null)
  const [revealedWatch, setRevealedWatch] = useState<IWatch | null>(null)
  const [errorCode, setErrorCode] = useState<EPurchaseErrorCode | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const lidTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // After leaving, the box needs a moment to fly back before another one may be selected.
  const selectionLockedUntilMilliseconds = useRef<number>(0)

  // --------------------------- Store ------------------------- //
  const balanceInCents = useStore(state => state.balanceInCents)

  // ----------------------- Queries / mutations -------------------- //
  const { mutatePurchaseBoxAsync } = usePostPurchaseBoxMutation()

  // -------------------------- Values ------------------------- //
  // Shared with the 3D scene, which reads them on every frame.
  const sceneState = useMemo(() => createSynchronizable<IOpeningSceneState>(INITIAL_OPENING_SCENE_STATE), [])
  const dragState = useMemo(() => createSynchronizable<IDragState>(INITIAL_DRAG_STATE), [])
  const selectedBox = useMemo(
    () => boxesData?.boxes.find(box => box.identifier === selectedBoxIdentifier),
    [boxesData, selectedBoxIdentifier],
  )
  const isAffordable = selectedBox ? balanceInCents >= selectedBox.priceInCents : false
  const primaryActionState = getPrimaryActionForPhase(phase, isAffordable)

  // ------------------- Handlers -------------------------- //
  const handleCardPress = (boxIdentifier: EBoxIdentifier) => {
    const cardIndex = cards.findIndex(card => card.identifier === boxIdentifier)

    if (phase !== EOpeningPhase.Browsing || cardIndex < 0 || Date.now() < selectionLockedUntilMilliseconds.current) {
      return
    }

    setSelectedBoxIdentifier(boxIdentifier)

    setRevealedWatch(null)

    setErrorCode(null)

    dragState.setBlocking(INITIAL_DRAG_STATE)

    sceneState.setBlocking(startFocus(sceneState.getBlocking(), cardIndex, Date.now()))

    dispatchEvent(EOpeningEvent.BoxSelected)

    void hapticFeedback.selection()
  }

  const handleBuyPress = async () => {
    if (phase !== EOpeningPhase.Inspecting || !selectedBox) {
      return
    }

    setErrorCode(null)

    dispatchEvent(EOpeningEvent.PurchasePressed)

    const result = await mutatePurchaseBoxAsync(selectedBox)

    if (result.status === EBoxPurchaseResultStatus.Success) {
      setRevealedWatch(result.response.watch)

      dispatchEvent(EOpeningEvent.PurchaseSucceeded)

      void hapticFeedback.success()
    } else if (result.status === EBoxPurchaseResultStatus.Failed) {
      setErrorCode(result.errorCode)

      dispatchEvent(EOpeningEvent.PurchaseFailed)

      void hapticFeedback.error()
    }
  }

  const handleOpenPress = () => {
    if (phase !== EOpeningPhase.Ready) {
      return
    }

    sceneState.setBlocking(startLidOpen(sceneState.getBlocking(), Date.now()))

    dispatchEvent(EOpeningEvent.OpenPressed)

    void hapticFeedback.lidOpening()

    lidTimer.current = setTimeout(() => {
      dispatchEvent(EOpeningEvent.LidOpened)
    }, LID_OPEN_DURATION_MILLISECONDS)
  }

  const handleBackPress = () => {
    if (!INTERACTIVE_PHASES.includes(phase)) {
      return
    }

    selectionLockedUntilMilliseconds.current = Date.now() + FOCUS_DURATION_MILLISECONDS

    sceneState.setBlocking(startClose(sceneState.getBlocking(), Date.now()))

    setErrorCode(null)

    dispatchEvent(EOpeningEvent.ClosePressed)
  }

  const handlePrimaryPress = (action: EOpeningPrimaryAction) => {
    if (action === EOpeningPrimaryAction.Buy) {
      void handleBuyPress()
    } else if (action === EOpeningPrimaryAction.Open) {
      handleOpenPress()
    } else {
      handleBackPress()
    }
  }

  // ------------------- Gesture ------------------------- //
  // Drag to inspect: the finger turns the box, a release keeps it turning (inertia, see the scene).
  const panGesture = usePanGesture({
    runOnJS: true,
    enabled: INTERACTIVE_PHASES.includes(phase),
    onActivate: () => {
      setIsDragging(true)
    },
    onUpdate: event => {
      dragState.setBlocking(applyDragMovement(dragState.getBlocking(), event.changeX, event.changeY, DRAG_RADIANS_PER_PIXEL))
    },
    onDeactivate: event => {
      dragState.setBlocking({
        ...dragState.getBlocking(),
        isDragging: false,
        yawVelocityRadiansPerSecond: event.velocityX * DRAG_RADIANS_PER_PIXEL,
        pitchVelocityRadiansPerSecond: event.velocityY * DRAG_RADIANS_PER_PIXEL,
      })
    },
    onFinalize: () => {
      dragState.setBlocking({ ...dragState.getBlocking(), isDragging: false })

      setIsDragging(false)
    },
  })

  // ------------------- Side effects ----------------------- //
  useEffect(
    () => () => {
      clearTimeout(lidTimer.current)
    },
    [],
  )

  // ------------------------ View data ------------------------ //
  const primaryButton: IOpeningPrimaryButton | null = primaryActionState
    ? {
        labelText: getPrimaryLabelText(t, primaryActionState.action, phase, selectedBox ? formatCurrency(selectedBox.priceInCents) : ''),
        isDisabled: primaryActionState.isDisabled,
        testID: `${primaryActionState.action}Button`,
        onPress: () => {
          handlePrimaryPress(primaryActionState.action)
        },
      }
    : null

  const reveal: IOpeningReveal | null =
    phase === EOpeningPhase.Revealed && revealedWatch
      ? {
          titleText: t('opening.revealTitle'),
          nameText: revealedWatch.name,
          brandText: revealedWatch.brand,
          valueText: t('opening.watchValue', { amount: formatCurrency(revealedWatch.valueInCents) }),
          imageSource: WATCH_IMAGE_SOURCES[revealedWatch.identifier],
        }
      : null

  return {
    phase,
    isOverlayVisible: phase !== EOpeningPhase.Browsing,
    isListHidden: phase !== EOpeningPhase.Browsing,
    isDragging,
    boxNameText: selectedBox?.name ?? '',
    priceText: selectedBox ? formatCurrency(selectedBox.priceInCents) : '',
    hintText: getHintText(t, phase, isAffordable),
    errorText: errorCode ? t(`opening.errors.${errorCode}`) : null,
    backLabelText: t('opening.back'),
    isBackVisible: phase === EOpeningPhase.Inspecting || phase === EOpeningPhase.Ready,
    primaryButton,
    reveal,
    panGesture,
    sceneState,
    dragState,
    handleCardPress,
    handleBackPress,
  }
}

const getPrimaryLabelText = (t: TFunction, action: EOpeningPrimaryAction, phase: EOpeningPhase, priceText: string): string => {
  if (action === EOpeningPrimaryAction.Buy) {
    return phase === EOpeningPhase.Purchasing ? t('opening.buying') : t('opening.buy', { price: priceText })
  }

  if (action === EOpeningPrimaryAction.Open) {
    return phase === EOpeningPhase.Opening ? t('opening.opening') : t('opening.open')
  }

  return t('opening.done')
}

const getHintText = (t: TFunction, phase: EOpeningPhase, isAffordable: boolean): string => {
  if (phase === EOpeningPhase.Inspecting) {
    return isAffordable ? t('opening.hintInspect') : t('catalogue.notEnoughBalance')
  }

  if (phase === EOpeningPhase.Ready) {
    return t('opening.hintReady')
  }

  return phase === EOpeningPhase.Opening ? t('opening.hintOpening') : ''
}
