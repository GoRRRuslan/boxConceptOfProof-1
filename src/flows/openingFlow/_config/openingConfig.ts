// Timing
export const FOCUS_DURATION_MILLISECONDS = 500
export const LID_OPEN_DURATION_MILLISECONDS = 1100
export const LID_CLOSE_DURATION_MILLISECONDS = 500

// Where and how big the opened box is, relative to the viewport.
// Closed, the box is big and near the middle; open, it shrinks and moves down to leave room above it
// for the revealed watch (the open lid is much taller than the closed box).
export const FOCUSED_CLOSED_WIDTH_FRACTION = 0.55
export const FOCUSED_OPEN_WIDTH_FRACTION = 0.4
export const FOCUSED_CLOSED_CENTER_OFFSET_FRACTION = 0.06
export const FOCUSED_OPEN_CENTER_OFFSET_FRACTION = 0.26
export const FOCUSED_BASE_YAW_RADIANS = Math.PI - 0.4
export const FOCUSED_BASE_PITCH_RADIANS = 0.5

// Drag to inspect
export const DRAG_RADIANS_PER_PIXEL = 0.012
export const DRAG_PITCH_MINIMUM_RADIANS = -0.35
export const DRAG_PITCH_MAXIMUM_RADIANS = 0.55
// Inertia: velocity is multiplied by this much every 1/60 s after the finger lifts.
export const DRAG_INERTIA_DECAY_PER_FRAME = 0.94
export const DRAG_INERTIA_STOP_VELOCITY = 0.02

// A very slow sway keeps the centred box alive while the user does nothing.
export const IDLE_SWAY_AMPLITUDE_RADIANS = 0.06
export const IDLE_SWAY_PERIOD_MILLISECONDS = 4000
