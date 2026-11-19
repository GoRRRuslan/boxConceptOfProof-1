import type { Float3 } from 'react-native-filament'

// One shared Filament scene renders every box (see docs/STAGE_1_FINDINGS.md).
export const SINGLE_MODEL_POSITIONS: Float3[] = [[0, 0, 0]]
export const GRID_MODEL_POSITIONS: Float3[] = [
  [-0.7, 1.3, 0],
  [0.7, 1.3, 0],
  [-0.7, -0.1, 0],
  [0.7, -0.1, 0],
]

export const SINGLE_MODEL_SCALE: Float3 = [1, 1, 1]
export const GRID_MODEL_SCALE: Float3 = [0.55, 0.55, 0.55]

export const SINGLE_MODEL_CAMERA_POSITION: Float3 = [1.8, 1.8, -3.6]
export const SINGLE_MODEL_CAMERA_TARGET: Float3 = [0, 0.8, 0.1]
export const GRID_MODEL_CAMERA_POSITION: Float3 = [1.5, 2.2, -6]
export const GRID_MODEL_CAMERA_TARGET: Float3 = [0, 0.9, 0]
