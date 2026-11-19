// All sizes are in density-independent pixels and are used BOTH by the list styles and by the 3D
// placement maths, so a box always lands exactly in the transparent slot of its card.
export const CARD_HEIGHT = 300
export const BOX_SLOT_HEIGHT = 190
export const LIST_TOP_PADDING = 8

// Camera: looks down -Z at the plane z = 0 where the boxes live. Filament's lens projection uses a
// 24 mm tall sensor, so the visible world height at distance d is d * 24 / focalLength.
export const CAMERA_DISTANCE = 6
export const CAMERA_FOCAL_LENGTH_MILLIMETERS = 50
export const SENSOR_HEIGHT_MILLIMETERS = 24

// Box model (docs/MODEL.md): 1.12 wide, 1.1166 high, base at Y = 0.
export const BOX_WIDTH_UNITS = 1.12
export const BOX_CENTER_HEIGHT_UNITS = 0.56
// How much of the slot height the closed box fills.
export const BOX_SLOT_FILL = 0.64

// The model's front faces -Z, the camera sits at +Z, so the box is turned half a circle and then
// a little to show a three-quarter view from above.
export const BOX_BASE_PITCH_RADIANS = 0.38
export const BOX_BASE_YAW_RADIANS = Math.PI - 0.55
// The box turns by this much from the top to the bottom of the screen: it moves while you scroll.
export const BOX_PARALLAX_YAW_RADIANS = 0.9

// Cards further than this many card heights from the middle of the viewport are parked off screen.
export const VISIBILITY_MARGIN_IN_CARDS = 1.5
export const PARKED_BOX_HEIGHT_UNITS = -1000
