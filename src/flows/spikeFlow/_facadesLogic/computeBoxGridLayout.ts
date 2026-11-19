import type { Float3 } from 'react-native-filament'

export interface IBoxGridLayout {
  positions: Float3[]
  scale: Float3
  cameraPosition: Float3
  cameraTarget: Float3
}

// Box footprint from docs/MODEL.md: X ±0.56 (width 1.12), Y 0…1.12 (height), Z ±0.38.
const BOX_WIDTH = 1.12
const BOX_HEIGHT = 1.12
// The open lid swings up to Y 1.87 and back to Z 0.85, so rows need extra vertical room.
const ROW_SPACING_FACTOR = 1.35
const COLUMN_SPACING_FACTOR = 1.25
const VERTICAL_FIELD_OF_VIEW_DEGREES = 46

// Lays `boxCount` boxes out on a centred grid around the origin and derives a uniform scale and
// a camera that frames all of them. One box is shown at full size from a three-quarter view.
export const computeBoxGridLayout = (boxCount: number): IBoxGridLayout => {
  if (boxCount === 1) {
    return {
      positions: [[0, 0, 0]],
      scale: [1, 1, 1],
      cameraPosition: [1.8, 1.8, -3.6],
      cameraTarget: [0, 0.8, 0.1],
    }
  }

  const columnCount = Math.ceil(Math.sqrt(boxCount))
  const rowCount = Math.ceil(boxCount / columnCount)
  const columnSpacing = BOX_WIDTH * COLUMN_SPACING_FACTOR
  const rowSpacing = BOX_HEIGHT * ROW_SPACING_FACTOR
  const gridWidth = columnCount * columnSpacing
  const gridHeight = rowCount * rowSpacing

  const positions: Float3[] = Array.from({ length: boxCount }, (_, boxIndex) => {
    const column = boxIndex % columnCount
    const row = Math.floor(boxIndex / columnCount)

    return [(column - (columnCount - 1) / 2) * columnSpacing, (rowCount - 1 - row) * rowSpacing, 0]
  })

  // Distance at which the grid fits the vertical field of view (with margin); width is the smaller side on a phone.
  const halfFieldOfViewRadians = (VERTICAL_FIELD_OF_VIEW_DEGREES / 2) * (Math.PI / 180)
  const cameraDistance = (Math.max(gridHeight, gridWidth * 1.9) * 0.62) / Math.tan(halfFieldOfViewRadians)

  return {
    positions,
    scale: [1, 1, 1],
    cameraPosition: [cameraDistance * 0.25, gridHeight * 0.75, -cameraDistance],
    cameraTarget: [0, gridHeight * 0.42, 0],
  }
}
