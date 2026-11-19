import {
  FOCUS_DURATION_MILLISECONDS,
  LID_CLOSE_DURATION_MILLISECONDS,
  LID_OPEN_DURATION_MILLISECONDS,
} from '@flows/openingFlow/_config/openingConfig'
import { computeAnimatedProgress } from '@flows/openingFlow/_facadesLogic/openingEasing'
import type { IOpeningSceneState } from '@flows/openingFlow/_types'

export const INITIAL_OPENING_SCENE_STATE: IOpeningSceneState = {
  focusedCardIndex: -1,
  focusTarget: 0,
  focusFromProgress: 0,
  focusStartedAtMilliseconds: 0,
  lidTarget: 0,
  lidFromProgress: 0,
  lidStartedAtMilliseconds: 0,
}

// Linear 0..1 progress of the "box flies to the centre" animation at `nowMilliseconds`.
export const getFocusProgress = (state: IOpeningSceneState, nowMilliseconds: number): number => {
  'worklet'

  return computeAnimatedProgress({
    fromProgress: state.focusFromProgress,
    target: state.focusTarget,
    startedAtMilliseconds: state.focusStartedAtMilliseconds,
    nowMilliseconds,
    durationMilliseconds: FOCUS_DURATION_MILLISECONDS,
  })
}

// Linear 0..1 progress of the lid (0 closed, 1 fully open) at `nowMilliseconds`.
export const getLidProgress = (state: IOpeningSceneState, nowMilliseconds: number): number => {
  'worklet'

  return computeAnimatedProgress({
    fromProgress: state.lidFromProgress,
    target: state.lidTarget,
    startedAtMilliseconds: state.lidStartedAtMilliseconds,
    nowMilliseconds,
    durationMilliseconds: state.lidTarget === 1 ? LID_OPEN_DURATION_MILLISECONDS : LID_CLOSE_DURATION_MILLISECONDS,
  })
}

// A box was selected: fly it to the centre. The lid starts closed.
export const startFocus = (state: IOpeningSceneState, cardIndex: number, nowMilliseconds: number): IOpeningSceneState => ({
  ...state,
  focusedCardIndex: cardIndex,
  focusTarget: 1,
  focusFromProgress: getFocusProgress(state, nowMilliseconds),
  focusStartedAtMilliseconds: nowMilliseconds,
  lidTarget: 0,
  lidFromProgress: 0,
  lidStartedAtMilliseconds: nowMilliseconds,
})

// Leaving: the box flies back into its card and the lid closes, both from wherever they are now.
export const startClose = (state: IOpeningSceneState, nowMilliseconds: number): IOpeningSceneState => ({
  ...state,
  focusTarget: 0,
  focusFromProgress: getFocusProgress(state, nowMilliseconds),
  focusStartedAtMilliseconds: nowMilliseconds,
  lidTarget: 0,
  lidFromProgress: getLidProgress(state, nowMilliseconds),
  lidStartedAtMilliseconds: nowMilliseconds,
})

export const startLidOpen = (state: IOpeningSceneState, nowMilliseconds: number): IOpeningSceneState => ({
  ...state,
  lidTarget: 1,
  lidFromProgress: getLidProgress(state, nowMilliseconds),
  lidStartedAtMilliseconds: nowMilliseconds,
})
