import { computeBoxPose } from '@flows/catalogueFlow/_facadesLogic/computeBoxPose'
import { FOCUSED_BASE_PITCH_RADIANS, FOCUSED_BASE_YAW_RADIANS } from '@flows/openingFlow/_config/openingConfig'
import { computeOpeningPose } from '@flows/openingFlow/_facadesLogic/computeOpeningPose'

const viewport = { viewportWidth: 390, viewportHeight: 700 }
const listPose = computeBoxPose({ cardIndex: 1, scrollOffset: 0, viewportHeight: viewport.viewportHeight })
const base = {
  ...viewport,
  listPose,
  dragYawRadians: 0,
  dragPitchRadians: 0,
  idleSwayRadians: 0,
  lidProgress: 0,
}

describe('computeOpeningPose', () => {
  it('leaves a card exactly in its list pose before anything is selected', () => {
    const pose = computeOpeningPose({ ...base, isFocusedCard: false, focusProgress: 0 })

    expect(pose.scale).toBe(listPose.scale)

    expect(pose.translateY).toBe(listPose.translateY)

    expect(pose.isVisible).toBe(true)
  })

  it('shrinks the cards that are not selected and hides them when the focus is complete', () => {
    const half = computeOpeningPose({ ...base, isFocusedCard: false, focusProgress: 0.5 })
    const done = computeOpeningPose({ ...base, isFocusedCard: false, focusProgress: 1 })

    expect(half.scale).toBeCloseTo(listPose.scale / 2)

    expect(done.isVisible).toBe(false)
  })

  it('moves the selected box from its list position to the centre and makes it bigger', () => {
    const start = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 0 })
    const end = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 1 })

    expect(start.translateY).toBeCloseTo(listPose.translateY)

    expect(end.scale).toBeGreaterThan(start.scale)

    // The centred box sits a little below the middle of the screen (room for the reveal above it).
    expect(end.translateY).toBeLessThan(0)

    expect(end.yawRadians).toBeCloseTo(FOCUSED_BASE_YAW_RADIANS)

    expect(end.pitchRadians).toBeCloseTo(FOCUSED_BASE_PITCH_RADIANS)
  })

  it('adds the drag rotation and the idle sway only to the focused box', () => {
    const turned = computeOpeningPose({
      ...base,
      isFocusedCard: true,
      focusProgress: 1,
      dragYawRadians: 0.5,
      dragPitchRadians: 0.1,
      idleSwayRadians: 0.02,
    })

    expect(turned.yawRadians).toBeCloseTo(FOCUSED_BASE_YAW_RADIANS + 0.52)

    expect(turned.pitchRadians).toBeCloseTo(FOCUSED_BASE_PITCH_RADIANS + 0.1)

    const other = computeOpeningPose({ ...base, isFocusedCard: false, focusProgress: 1, dragYawRadians: 0.5 })

    expect(other.yawRadians).toBe(listPose.yawRadians)
  })

  it('shrinks and lowers the opened box to leave room for the revealed watch', () => {
    const closed = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 1, lidProgress: 0 })
    const open = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 1, lidProgress: 1 })

    expect(open.scale).toBeLessThan(closed.scale)

    expect(open.translateY).toBeLessThan(closed.translateY)
  })

  it('makes the box fill the same share of the width on any screen size', () => {
    const narrow = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 1, viewportWidth: 320 })
    const wide = computeOpeningPose({ ...base, isFocusedCard: true, focusProgress: 1, viewportWidth: 640 })

    expect(wide.scale / narrow.scale).toBeCloseTo(2)
  })
})
