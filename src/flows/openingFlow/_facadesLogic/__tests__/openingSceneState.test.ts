import { FOCUS_DURATION_MILLISECONDS, LID_OPEN_DURATION_MILLISECONDS } from '@flows/openingFlow/_config/openingConfig'
import {
  INITIAL_OPENING_SCENE_STATE,
  getFocusProgress,
  getLidProgress,
  startClose,
  startFocus,
  startLidOpen,
} from '@flows/openingFlow/_facadesLogic/openingSceneState'

describe('openingSceneState', () => {
  it('is idle at the start: nothing focused, lid closed', () => {
    expect(getFocusProgress(INITIAL_OPENING_SCENE_STATE, 5000)).toBe(0)

    expect(getLidProgress(INITIAL_OPENING_SCENE_STATE, 5000)).toBe(0)
  })

  it('focusing a card flies it to the centre over the focus duration', () => {
    const state = startFocus(INITIAL_OPENING_SCENE_STATE, 3, 1000)

    expect(state.focusedCardIndex).toBe(3)

    expect(getFocusProgress(state, 1000)).toBe(0)

    expect(getFocusProgress(state, 1000 + FOCUS_DURATION_MILLISECONDS / 2)).toBeCloseTo(0.5)

    expect(getFocusProgress(state, 1000 + FOCUS_DURATION_MILLISECONDS)).toBe(1)
  })

  it('opening the lid takes the lid duration', () => {
    const focused = startFocus(INITIAL_OPENING_SCENE_STATE, 0, 0)
    const opening = startLidOpen(focused, 2000)

    expect(getLidProgress(opening, 2000)).toBe(0)

    expect(getLidProgress(opening, 2000 + LID_OPEN_DURATION_MILLISECONDS)).toBe(1)
  })

  it('closing starts from where the animations are now, not from the end', () => {
    const focused = startFocus(INITIAL_OPENING_SCENE_STATE, 0, 0)
    const opening = startLidOpen(focused, 1000)
    const closingAt = 1000 + LID_OPEN_DURATION_MILLISECONDS / 2
    const closing = startClose(opening, closingAt)

    expect(getLidProgress(closing, closingAt)).toBeCloseTo(0.5)

    expect(getFocusProgress(closing, closingAt)).toBe(1)

    expect(getLidProgress(closing, closingAt + 10_000)).toBe(0)

    expect(getFocusProgress(closing, closingAt + 10_000)).toBe(0)
  })

  it('keeps the card index while closing so the box can fly back into its own card', () => {
    const focused = startFocus(INITIAL_OPENING_SCENE_STATE, 5, 0)

    expect(startClose(focused, 800).focusedCardIndex).toBe(5)
  })
})
