import { useMemo } from 'react'
import { RenderCallbackContext, useFilamentContext, useModel, useWorkletEffect } from 'react-native-filament'
import type { Synchronizable } from 'react-native-worklets'

import boxModelSource from '@assets/models/box.glb'
import { BOX_CENTER_HEIGHT_UNITS } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import { computeBoxPose } from '@flows/catalogueFlow/_facadesLogic/computeBoxPose'
import type { ICatalogueCard, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import {
  IDLE_SWAY_AMPLITUDE_RADIANS,
  IDLE_SWAY_PERIOD_MILLISECONDS,
} from '@flows/openingFlow/_config/openingConfig'
import { computeOpeningPose } from '@flows/openingFlow/_facadesLogic/computeOpeningPose'
import { easeInOutCubic, easeOutBack } from '@flows/openingFlow/_facadesLogic/openingEasing'
import { getFocusProgress, getLidProgress } from '@flows/openingFlow/_facadesLogic/openingSceneState'
import { stepDragInertia } from '@flows/openingFlow/_facadesLogic/stepDragInertia'
import type { IDragState, IOpeningSceneState } from '@flows/openingFlow/_types'
import {
  LID_FULLY_OPEN_ANGLE_DEGREES,
  LID_HINGE_PIVOT,
} from '@services/filament/computeLidHingeTransform'

interface IUseFacadeCatalogueBoxesParams {
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport
  scrollOffset: Synchronizable<number>
  openingScene: Synchronizable<IOpeningSceneState>
  dragState: Synchronizable<IDragState>
}

// Parts of the model (docs/MODEL.md). The first primitive of base and lid is the outer body surface.
enum EBoxPartName {
  Base = 'Shell_Base',
  Lid = 'Shell_Lid',
  Wordmark = 'Shell_Wordmark',
}

const BODY_PRIMITIVE_BY_PART: Record<string, number> = { [EBoxPartName.Base]: 0, [EBoxPartName.Lid]: 0 }
const LID_PART_NAMES: string[] = [EBoxPartName.Lid, EBoxPartName.Wordmark]
const MAXIMUM_FRAME_SECONDS = 0.05
const PARKED_HEIGHT = -1000

// One GLB loaded once, one instance per card. Every frame each instance is placed for the current
// scroll offset and opening state: in its card, or (for the opened box) centred, turned by the
// user's finger, with the lid at its current angle.
export const useFacadeCatalogueBoxes = ({
  cards,
  viewport,
  scrollOffset,
  openingScene,
  dragState,
}: IUseFacadeCatalogueBoxesParams) => {
  const { transformManager, renderableManager, nameComponentManager } = useFilamentContext()
  const model = useModel(boxModelSource, { instanceCount: cards.length })
  const { width: viewportWidth, height: viewportHeight } = viewport

  // -------------------------- Values ------------------------- //
  const instances = useMemo(() => (model.state === 'loaded' ? model.asset.getAssetInstances() : []), [model])
  const rootEntities = useMemo(() => instances.map(instance => instance.getRoot()), [instances])
  const lidEntitiesByCard = useMemo(
    () =>
      instances.map(instance =>
        instance.getEntities().filter(entity => LID_PART_NAMES.includes(nameComponentManager.getEntityName(entity) ?? ''))),
    [instances, nameComponentManager],
  )
  const colors = useMemo(() => cards.map(card => card.colorLinearRgba), [cards])

  // ------------------- Side effects ----------------------- //
  // Colour of every box: the outer body (base and lid) of each instance gets the colour of its card.
  useWorkletEffect(() => {
    'worklet'

    instances.forEach((instance, instanceIndex) => {
      instance.getEntities().forEach(entity => {
        const partName = nameComponentManager.getEntityName(entity)
        const bodyPrimitiveIndex = partName === undefined ? undefined : BODY_PRIMITIVE_BY_PART[partName]

        if (bodyPrimitiveIndex !== undefined) {
          renderableManager
            .getMaterialInstanceAt(entity, bodyPrimitiveIndex)
            .setFloat4Parameter('baseColorFactor', colors[instanceIndex])
        }
      })
    })
  })

  // Runs on the Filament runtime right before every frame, no React involved.
  RenderCallbackContext.useRenderCallback(
    frameInfo => {
      'worklet'

      if (viewportHeight === 0) {
        return
      }

      const nowMilliseconds = Date.now()
      const deltaSeconds = Math.min(frameInfo.timeSinceLastFrame, MAXIMUM_FRAME_SECONDS)
      const scene = openingScene.getBlocking()
      const currentScrollOffset = scrollOffset.getBlocking()
      const focusProgress = easeInOutCubic(getFocusProgress(scene, nowMilliseconds))
      const lidProgress = getLidProgress(scene, nowMilliseconds)
      const lidAngleRadians =
        (LID_FULLY_OPEN_ANGLE_DEGREES * (scene.lidTarget === 1 ? easeOutBack(lidProgress) : easeInOutCubic(lidProgress)) * Math.PI) / 180

      // Inertia: after the finger lifts the box keeps turning and slows down.
      let drag = dragState.getBlocking()

      if (!drag.isDragging && (drag.yawVelocityRadiansPerSecond !== 0 || drag.pitchVelocityRadiansPerSecond !== 0)) {
        drag = stepDragInertia(drag, deltaSeconds)

        dragState.setBlocking(drag)
      }

      const idleSwayRadians = drag.isDragging
        ? 0
        : Math.sin((nowMilliseconds / IDLE_SWAY_PERIOD_MILLISECONDS) * 2 * Math.PI) * IDLE_SWAY_AMPLITUDE_RADIANS * focusProgress

      rootEntities.forEach((rootEntity, cardIndex) => {
        const listPose = computeBoxPose({ cardIndex, scrollOffset: currentScrollOffset, viewportHeight })
        const pose = computeOpeningPose({
          listPose,
          isFocusedCard: cardIndex === scene.focusedCardIndex,
          lidProgress,
          focusProgress,
          viewportWidth,
          viewportHeight,
          dragYawRadians: drag.yawRadians,
          dragPitchRadians: drag.pitchRadians,
          idleSwayRadians,
        })
        const matrix = transformManager
          .createIdentityMatrix()
          .translate([0, -BOX_CENTER_HEIGHT_UNITS, 0])
          .scaling([pose.scale, pose.scale, pose.scale])
          .rotate(pose.pitchRadians, [1, 0, 0])
          .rotate(pose.yawRadians, [0, 1, 0])
          .translate([0, pose.isVisible ? pose.translateY : PARKED_HEIGHT, 0])

        transformManager.setTransform(rootEntity, matrix)
      })

      // The lid (and its wordmark) of the opened box swings about the hinge pivot.
      const lidEntities = lidEntitiesByCard[scene.focusedCardIndex]

      if (lidEntities) {
        const [, pivotY, pivotZ] = LID_HINGE_PIVOT
        const hingeMatrix = transformManager
          .createIdentityMatrix()
          .translate([0, -pivotY, -pivotZ])
          .rotate(lidAngleRadians, [1, 0, 0])
          .translate([0, pivotY, pivotZ])

        lidEntities.forEach(lidEntity => {
          transformManager.setTransform(lidEntity, hingeMatrix)
        })
      }
    },
    [
      transformManager,
      rootEntities,
      lidEntitiesByCard,
      scrollOffset,
      openingScene,
      dragState,
      viewportWidth,
      viewportHeight,
    ],
  )

  return { modelState: model.state }
}
