import { DRAG_PITCH_MAXIMUM_RADIANS, DRAG_PITCH_MINIMUM_RADIANS, DRAG_RADIANS_PER_PIXEL } from '@flows/openingFlow/_config/openingConfig'
import { INITIAL_DRAG_STATE, applyDragMovement, stepDragInertia } from '@flows/openingFlow/_facadesLogic/stepDragInertia'

describe('applyDragMovement', () => {
  it('turns the box with the finger and marks the drag as active', () => {
    const state = applyDragMovement(INITIAL_DRAG_STATE, 100, 0, DRAG_RADIANS_PER_PIXEL)

    expect(state.yawRadians).toBeCloseTo(100 * DRAG_RADIANS_PER_PIXEL)

    expect(state.isDragging).toBe(true)
  })

  it('keeps the pitch inside its limits however far the finger goes', () => {
    expect(applyDragMovement(INITIAL_DRAG_STATE, 0, 10_000, DRAG_RADIANS_PER_PIXEL).pitchRadians).toBe(DRAG_PITCH_MAXIMUM_RADIANS)

    expect(applyDragMovement(INITIAL_DRAG_STATE, 0, -10_000, DRAG_RADIANS_PER_PIXEL).pitchRadians).toBe(DRAG_PITCH_MINIMUM_RADIANS)
  })
})

describe('stepDragInertia', () => {
  const released = { ...INITIAL_DRAG_STATE, yawVelocityRadiansPerSecond: 4, isDragging: false }

  it('does not move while the finger is down', () => {
    const dragging = { ...released, isDragging: true }

    expect(stepDragInertia(dragging, 1 / 60)).toBe(dragging)
  })

  it('keeps turning after release and slows down', () => {
    const next = stepDragInertia(released, 1 / 60)

    expect(next.yawRadians).toBeGreaterThan(0)

    expect(next.yawVelocityRadiansPerSecond).toBeLessThan(4)
  })

  it('comes to a full stop eventually', () => {
    let state = released

    for (let frame = 0; frame < 600; frame += 1) {
      state = stepDragInertia(state, 1 / 60)
    }

    expect(state.yawVelocityRadiansPerSecond).toBe(0)
  })

  it('travels the same distance at 30 and 60 frames per second', () => {
    let fast = released
    let slow = released

    for (let frame = 0; frame < 120; frame += 1) {
      fast = stepDragInertia(fast, 1 / 60)
    }

    for (let frame = 0; frame < 60; frame += 1) {
      slow = stepDragInertia(slow, 1 / 30)
    }

    expect(Math.abs(fast.yawRadians - slow.yawRadians)).toBeLessThan(0.1)
  })
})
