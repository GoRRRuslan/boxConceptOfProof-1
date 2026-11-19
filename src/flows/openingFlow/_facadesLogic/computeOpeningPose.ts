import { BOX_WIDTH_UNITS, CAMERA_DISTANCE, CAMERA_FOCAL_LENGTH_MILLIMETERS, SENSOR_HEIGHT_MILLIMETERS } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import type { IBoxPose } from '@flows/catalogueFlow/_facadesLogic/computeBoxPose'
import {
  FOCUSED_BASE_PITCH_RADIANS,
  FOCUSED_BASE_YAW_RADIANS,
  FOCUSED_CLOSED_CENTER_OFFSET_FRACTION,
  FOCUSED_CLOSED_WIDTH_FRACTION,
  FOCUSED_OPEN_CENTER_OFFSET_FRACTION,
  FOCUSED_OPEN_WIDTH_FRACTION,
} from '@flows/openingFlow/_config/openingConfig'
import { interpolate } from '@flows/openingFlow/_facadesLogic/openingEasing'
import type { IOpeningPose } from '@flows/openingFlow/_types'

interface IOpeningPoseParams {
  // Where the box sits in the list (from computeBoxPose).
  listPose: IBoxPose
  isFocusedCard: boolean
  // 0 = lid closed, 1 = lid fully open: the opened box makes room for the revealed watch.
  lidProgress: number
  // 0 = in the list, 1 = centred; already eased.
  focusProgress: number
  viewportWidth: number
  viewportHeight: number
  dragYawRadians: number
  dragPitchRadians: number
  idleSwayRadians: number
}

// Blends a card's list pose with the centred "inspect" pose. The focused card flies to the middle
// of the screen and grows; every other card shrinks away. Pure maths, runs on the worklet runtime.
export const computeOpeningPose = ({
  listPose,
  isFocusedCard,
  lidProgress,
  focusProgress,
  viewportWidth,
  viewportHeight,
  dragYawRadians,
  dragPitchRadians,
  idleSwayRadians,
}: IOpeningPoseParams): IOpeningPose => {
  'worklet'

  if (!isFocusedCard) {
    const scale = listPose.scale * (1 - focusProgress)

    return {
      isVisible: listPose.isVisible && scale > 0.001,
      scale,
      yawRadians: listPose.yawRadians,
      pitchRadians: listPose.pitchRadians,
      translateY: listPose.translateY,
    }
  }

  const visibleWorldHeight = (CAMERA_DISTANCE * SENSOR_HEIGHT_MILLIMETERS) / CAMERA_FOCAL_LENGTH_MILLIMETERS
  const worldUnitsPerPixel = visibleWorldHeight / viewportHeight
  const widthFraction = interpolate(FOCUSED_CLOSED_WIDTH_FRACTION, FOCUSED_OPEN_WIDTH_FRACTION, lidProgress)
  const offsetFraction = interpolate(FOCUSED_CLOSED_CENTER_OFFSET_FRACTION, FOCUSED_OPEN_CENTER_OFFSET_FRACTION, lidProgress)
  const focusedScale = (widthFraction * viewportWidth * worldUnitsPerPixel) / BOX_WIDTH_UNITS
  const focusedTranslateY = -offsetFraction * viewportHeight * worldUnitsPerPixel

  return {
    isVisible: true,
    scale: interpolate(listPose.scale, focusedScale, focusProgress),
    yawRadians: interpolate(listPose.yawRadians, FOCUSED_BASE_YAW_RADIANS + dragYawRadians + idleSwayRadians, focusProgress),
    pitchRadians: interpolate(listPose.pitchRadians, FOCUSED_BASE_PITCH_RADIANS + dragPitchRadians, focusProgress),
    translateY: interpolate(listPose.translateY, focusedTranslateY, focusProgress),
  }
}
