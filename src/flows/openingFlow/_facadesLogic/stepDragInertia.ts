import {
  DRAG_INERTIA_DECAY_PER_FRAME,
  DRAG_INERTIA_STOP_VELOCITY,
  DRAG_PITCH_MAXIMUM_RADIANS,
  DRAG_PITCH_MINIMUM_RADIANS,
} from '@flows/openingFlow/_config/openingConfig'
import type { IDragState } from '@flows/openingFlow/_types'

export const INITIAL_DRAG_STATE: IDragState = {
  yawRadians: 0,
  pitchRadians: 0,
  yawVelocityRadiansPerSecond: 0,
  pitchVelocityRadiansPerSecond: 0,
  isDragging: false,
}

// One frame of inertia after the finger lifted: the box keeps turning and slows down.
// The decay is framerate independent (`deltaSeconds`), and pitch stays inside its limits.
export const stepDragInertia = (state: IDragState, deltaSeconds: number): IDragState => {
  'worklet'

  if (state.isDragging) {
    return state
  }

  const decay = DRAG_INERTIA_DECAY_PER_FRAME ** (deltaSeconds * 60)
  const yawVelocity = state.yawVelocityRadiansPerSecond * decay
  const pitchVelocity = state.pitchVelocityRadiansPerSecond * decay
  const isMoving = Math.abs(yawVelocity) > DRAG_INERTIA_STOP_VELOCITY || Math.abs(pitchVelocity) > DRAG_INERTIA_STOP_VELOCITY
  const nextPitch = state.pitchRadians + (isMoving ? pitchVelocity * deltaSeconds : 0)

  return {
    ...state,
    yawRadians: state.yawRadians + (isMoving ? yawVelocity * deltaSeconds : 0),
    pitchRadians: Math.min(DRAG_PITCH_MAXIMUM_RADIANS, Math.max(DRAG_PITCH_MINIMUM_RADIANS, nextPitch)),
    yawVelocityRadiansPerSecond: isMoving ? yawVelocity : 0,
    pitchVelocityRadiansPerSecond: isMoving ? pitchVelocity : 0,
  }
}

// Applies a finger movement (pixels) to the drag state while the finger is down.
export const applyDragMovement = (state: IDragState, deltaX: number, deltaY: number, radiansPerPixel: number): IDragState => {
  'worklet'

  const nextPitch = state.pitchRadians + deltaY * radiansPerPixel

  return {
    ...state,
    yawRadians: state.yawRadians + deltaX * radiansPerPixel,
    pitchRadians: Math.min(DRAG_PITCH_MAXIMUM_RADIANS, Math.max(DRAG_PITCH_MINIMUM_RADIANS, nextPitch)),
    isDragging: true,
  }
}

