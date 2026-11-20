import { useEffect, useMemo } from 'react'
import {
  RenderCallbackContext,
  useConfigureAssetShadow,
  useFilamentContext,
  useModel,
  useWorkletEffect,
} from 'react-native-filament'
import { createSynchronizable } from 'react-native-worklets'

import boxModelSource from '@assets/models/box.glb'
import { BOX_CENTER_HEIGHT_UNITS, ENTRANCE_STAGGER_MILLISECONDS } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import { computeBoxPose } from '@flows/catalogueFlow/_facadesLogic/computeBoxPose'
import { computeEntranceScale, computePressScale } from '@flows/catalogueFlow/_facadesLogic/computeCardAnimation'
import type { ICatalogueCard, ICatalogueSceneSync, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import { TILT_PITCH_RADIANS, TILT_YAW_RADIANS } from '@flows/openingFlow/_config/openingConfig'
import { computeOpeningPose } from '@flows/openingFlow/_facadesLogic/computeOpeningPose'
import { easeInOutCubic, easeOutBack } from '@flows/openingFlow/_facadesLogic/openingEasing'
import {
  computeAnticipationEffect,
  computeGlowStrength,
  getAnticipationProgress,
  getFocusProgress,
  getLidProgress,
  getTuckProgress,
} from '@flows/openingFlow/_facadesLogic/openingSceneState'
import { isDragStateAnimating, stepDragInertia } from '@flows/openingFlow/_facadesLogic/stepDragInertia'
import {
  computeCameraPunch,
  computeIridescenceTint,
  computeJitterScale,
  computeLidSettleDegrees,
  computeSeamIntensity,
  getIridescenceStrength,
  getPopElapsedMilliseconds,
  getRarityProfile,
  extrapolateScrollOffset,
  stepParallaxOffset,
  stepScrollSway,
  stepScrollVelocity,
} from '@flows/openingFlow/_facadesLogic/computeSceneEffects'
import type { IOpeningPose } from '@flows/openingFlow/_types'
import { useFacadeSceneEffects } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/_components/CatalogueBoxes/_facades/useFacadeSceneEffects'
import { LID_FULLY_OPEN_ANGLE_DEGREES, LID_HINGE_PIVOT } from '@services/filament/computeLidHingeTransform'

interface IUseFacadeCatalogueBoxesParams {
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport
  sceneSync: ICatalogueSceneSync
}

// Parts of the model (docs/MODEL.md). The first primitive of base and lid is the outer body surface;
// the cushion and the inside of the lid (second primitive) are what the light inside the box falls on.
enum EBoxPartName {
  Base = 'Shell_Base',
  Lid = 'Shell_Lid',
  Wordmark = 'Shell_Wordmark',
  Cushion = 'Shell_Fitted_Cushion',
  Seam = 'Shell_Seam',
}

const BODY_PRIMITIVE_BY_PART: Record<string, number> = { [EBoxPartName.Base]: 0, [EBoxPartName.Lid]: 0 }
const GLOW_PRIMITIVE_BY_PART: Record<string, number> = { [EBoxPartName.Cushion]: 0, [EBoxPartName.Lid]: 1 }
// The coloured trim of the seam (first primitive of Shell_Seam) glows when the box is armed and while it opens.
const SEAM_PRIMITIVE_INDEX = 0
const LID_PART_NAMES: string[] = [EBoxPartName.Lid, EBoxPartName.Wordmark]
const MAXIMUM_FRAME_SECONDS = 0.05
const PARKED_HEIGHT = -1000
// Before the model is loaded the entrance has not started: the boxes are invisible until it does.
const ENTRANCE_NOT_STARTED = Number.MAX_SAFE_INTEGER

// One GLB loaded once, one instance per card. Every frame each instance is placed for the current
// scroll offset and opening state: in its card (popping in on first appearance, squeezed while pressed),
// or (for the opened box) centred and pushed towards the camera, turned by the finger / device tilt /
// auto-rotation, zoomed, shaking before the lid swings open, with light glowing from inside.
export const useFacadeCatalogueBoxes = ({ cards, viewport, sceneSync }: IUseFacadeCatalogueBoxesParams) => {
  const { transformManager, renderableManager, nameComponentManager } = useFilamentContext()
  const model = useModel(boxModelSource, { instanceCount: cards.length })
  const { width: viewportWidth, height: viewportHeight } = viewport
  const { scrollOffset, openingScene, dragState, tilt, pressState } = sceneSync

  // -------------------------- Values ------------------------- //
  const entranceStartedAt = useMemo(() => createSynchronizable<number>(ENTRANCE_NOT_STARTED), [])
  // Last glow strength written to a box (so a material is only touched when the strength really changes).
  const lastGlowStrength = useMemo(() => createSynchronizable<number>(0), [])
  const instances = useMemo(() => (model.state === 'loaded' ? model.asset.getAssetInstances() : []), [model])
  const rootEntities = useMemo(() => instances.map(instance => instance.getRoot()), [instances])
  const lidEntitiesByCard = useMemo(
    () =>
      instances.map(instance =>
        instance.getEntities().filter(entity => LID_PART_NAMES.includes(nameComponentManager.getEntityName(entity) ?? ''))),
    [instances, nameComponentManager],
  )
  const glowTargetsByCard = useMemo(
    () =>
      instances.map(instance =>
        instance.getEntities().flatMap(entity => {
          const partName = nameComponentManager.getEntityName(entity)
          const primitiveIndex = partName === undefined ? undefined : GLOW_PRIMITIVE_BY_PART[partName]

          return primitiveIndex === undefined ? [] : [{ entity, primitiveIndex }]
        })),
    [instances, nameComponentManager],
  )
  const seamEntitiesByCard = useMemo(
    () =>
      instances.map(instance =>
        instance.getEntities().filter(entity => nameComponentManager.getEntityName(entity) === EBoxPartName.Seam)),
    [instances, nameComponentManager],
  )
  const lastSeamIntensity = useMemo(() => createSynchronizable<number>(-1), [])
  // Scroll speed -> sway of the boxes: [last offset, time it changed, smoothed scroll speed] and the filtered sway.
  const scrollVelocityState = useMemo(() => createSynchronizable<[number, number, number]>([0, 0, 0]), [])
  const swayState = useMemo(() => createSynchronizable<number>(0), [])
  // The offset the parallax turn of the boxes is computed from (smoothed), and the first frame it was set on.
  const parallaxOffsetState = useMemo(() => createSynchronizable<number | null>(null), [])
  const { updateSceneEffects } = useFacadeSceneEffects(cards)
  // The outer body (base and lid) of every box: its colour shimmers on the glossy boxes (iridescence).
  const bodyTargetsByCard = useMemo(
    () =>
      instances.map(instance =>
        instance.getEntities().flatMap(entity => {
          const partName = nameComponentManager.getEntityName(entity)
          const primitiveIndex = partName === undefined ? undefined : BODY_PRIMITIVE_BY_PART[partName]

          return primitiveIndex === undefined ? [] : [{ entity, primitiveIndex }]
        })),
    [instances, nameComponentManager],
  )
  const lastIridescenceTints = useMemo(() => createSynchronizable<number[][]>([]), [])
  const looks = useMemo(() => cards.map(card => ({ color: card.colorLinearRgba, finish: card.finish })), [cards])

  // ------------------- Side effects ----------------------- //
  // The boxes cast and receive shadows (the lid shades the inside, the base shades itself).
  useConfigureAssetShadow({
    renderableManager,
    ...(model.state === 'loaded' ? { asset: model.asset } : {}),
    castShadow: true,
    receiveShadow: true,
  })

  // The entrance (boxes popping in one after the other) starts the moment the model is ready.
  useEffect(() => {
    if (model.state === 'loaded') {
      entranceStartedAt.setBlocking(Date.now())
    }
  }, [model.state, entranceStartedAt])

  // Look of every box: the outer body (base and lid) gets the colour and the finish (matte ... glossy metal) of its card.
  useWorkletEffect(() => {
    'worklet'

    instances.forEach((instance, instanceIndex) => {
      instance.getEntities().forEach(entity => {
        const partName = nameComponentManager.getEntityName(entity)
        const bodyPrimitiveIndex = partName === undefined ? undefined : BODY_PRIMITIVE_BY_PART[partName]

        if (bodyPrimitiveIndex !== undefined) {
          const { color, finish } = looks[instanceIndex]
          const materialInstance = renderableManager.getMaterialInstanceAt(entity, bodyPrimitiveIndex)

          materialInstance.setFloat4Parameter('baseColorFactor', color)

          materialInstance.setFloatParameter('roughnessFactor', finish.roughness)

          materialInstance.setFloatParameter('metallicFactor', finish.metallic)

          materialInstance.setFloatParameter('clearCoatFactor', finish.clearCoat)
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
      const focusLinearProgress = getFocusProgress(scene, nowMilliseconds)
      const focusProgress = easeInOutCubic(focusLinearProgress)
      const dollyProgress = easeOutBack(focusLinearProgress)
      const lidProgress = getLidProgress(scene, nowMilliseconds)
      const tuckProgress = easeInOutCubic(getTuckProgress(scene, nowMilliseconds))
      const popElapsed = getPopElapsedMilliseconds(scene, nowMilliseconds)
      // The shake dies away in the last moment before the lid is let go (the box holds its breath).
      const jitterScale = computeJitterScale(popElapsed)
      const rawAnticipation = computeAnticipationEffect(getAnticipationProgress(scene, nowMilliseconds), nowMilliseconds)
      const anticipation = {
        ...rawAnticipation,
        jitterYawRadians: rawAnticipation.jitterYawRadians * jitterScale,
        jitterPitchRadians: rawAnticipation.jitterPitchRadians * jitterScale,
      }
      const punch = computeCameraPunch(popElapsed, scene.rarityLevel)
      const seamIntensity = computeSeamIntensity(scene, nowMilliseconds, focusLinearProgress, tuckProgress)
      const lidAngleRadians =
        ((LID_FULLY_OPEN_ANGLE_DEGREES * (scene.lidTarget === 1 ? easeOutBack(lidProgress) : easeInOutCubic(lidProgress)) +
          (scene.lidTarget === 1 ? computeLidSettleDegrees(popElapsed) : 0)) *
          Math.PI) /
        180

      // The boxes sway against the direction of a fast scroll.
      const frameSeconds = Math.min(deltaSeconds, MAXIMUM_FRAME_SECONDS)
      const scrollVelocity = stepScrollVelocity(scrollVelocityState.getBlocking(), currentScrollOffset, nowMilliseconds, frameSeconds)
      const sway = stepScrollSway(swayState.getBlocking(), scrollVelocity[2], frameSeconds)
      const listScrollOffset = extrapolateScrollOffset(currentScrollOffset, scrollVelocity[2], scrollVelocity[1], nowMilliseconds)
      const previousParallaxOffset = parallaxOffsetState.getBlocking()
      const parallaxOffset =
        previousParallaxOffset === null ? listScrollOffset : stepParallaxOffset(previousParallaxOffset, listScrollOffset, frameSeconds)

      parallaxOffsetState.setBlocking(parallaxOffset)

      scrollVelocityState.setBlocking(scrollVelocity)

      swayState.setBlocking(sway)

      // Inspection physics: inertia after a flick, gliding back after a double tap, slow auto-rotation when left alone.
      const isAutoRotateAllowed = scene.focusTarget === 1 && scene.lidTarget === 0 && focusLinearProgress >= 1
      let drag = dragState.getBlocking()

      if (isDragStateAnimating(drag, isAutoRotateAllowed)) {
        drag = stepDragInertia(drag, deltaSeconds, nowMilliseconds, isAutoRotateAllowed)

        dragState.setBlocking(drag)
      }

      const [tiltX, tiltY] = scene.focusTarget === 1 ? tilt.getBlocking() : [0, 0]
      const press = pressState.getBlocking()
      const pressScale = computePressScale(press, nowMilliseconds)
      const entranceStart = entranceStartedAt.getBlocking()

      const poses: IOpeningPose[] = []
      let focusedPose: IOpeningPose | null = null
      let shakeX = 0

      rootEntities.forEach((rootEntity, cardIndex) => {
        const baseListPose = computeBoxPose({ cardIndex, scrollOffset: listScrollOffset, viewportHeight })
        // Where the box is (and how big) follows the list at once; how it TURNS with its place on the screen follows a smoothed offset.
        const parallaxYawRadians = computeBoxPose({ cardIndex, scrollOffset: parallaxOffset, viewportHeight }).yawRadians
        const listPose = { ...baseListPose, yawRadians: parallaxYawRadians + sway, pitchRadians: baseListPose.pitchRadians + sway * 0.5 }
        const entranceScale = computeEntranceScale(nowMilliseconds - entranceStart - cardIndex * ENTRANCE_STAGGER_MILLISECONDS)
        const squeeze = press.cardIndex === cardIndex ? pressScale : 1
        const openingPose = computeOpeningPose({
          listPose: { ...listPose, scale: listPose.scale * entranceScale * squeeze },
          isFocusedCard: cardIndex === scene.focusedCardIndex,
          lidProgress,
          focusProgress,
          dollyProgress,
          viewportWidth,
          viewportHeight,
          dragYawRadians: drag.yawRadians,
          dragPitchRadians: drag.pitchRadians,
          zoom: drag.zoom,
          autoYawRadians: drag.autoYawRadians,
          tiltYawRadians: tiltX * TILT_YAW_RADIANS,
          tiltPitchRadians: tiltY * TILT_PITCH_RADIANS,
          anticipation,
          tuckProgress,
        })
        const isFocusedCard = cardIndex === scene.focusedCardIndex
        // Camera punch: the focused box swells and shakes for a moment when the lid is let go.
        const pose = isFocusedCard
          ? {
              ...openingPose,
              scale: openingPose.scale * (1 + punch.scaleBoost),
              translateY: openingPose.translateY + punch.shakeY * openingPose.scale,
            }
          : openingPose
        const poseShakeX = isFocusedCard ? punch.shakeX * openingPose.scale : 0

        poses.push(pose)

        // Iridescence: the glossy boxes shimmer with the turn of the box (colour added to the base colour).
        const iridescenceStrength = getIridescenceStrength(looks[cardIndex].finish.metallic)

        if (iridescenceStrength > 0 && pose.isVisible) {
          const tint = computeIridescenceTint(iridescenceStrength, pose.yawRadians, pose.pitchRadians, nowMilliseconds)
          const previousTints = lastIridescenceTints.getBlocking()
          const previousTint = previousTints[cardIndex] as number[] | undefined

          if (!previousTint || Math.abs(previousTint[0] - tint[0]) + Math.abs(previousTint[1] - tint[1]) + Math.abs(previousTint[2] - tint[2]) > 0.006) {
            const [baseRed, baseGreen, baseBlue, baseAlpha] = looks[cardIndex].color

            bodyTargetsByCard[cardIndex].forEach(({ entity, primitiveIndex }) => {
              renderableManager
                .getMaterialInstanceAt(entity, primitiveIndex)
                .setFloat4Parameter('baseColorFactor', [Math.max(0, baseRed + tint[0]), Math.max(0, baseGreen + tint[1]), Math.max(0, baseBlue + tint[2]), baseAlpha])
            })

            const nextTints = [...previousTints]

            nextTints[cardIndex] = tint

            lastIridescenceTints.setBlocking(nextTints)
          }
        }

        if (isFocusedCard) {
          focusedPose = pose

          shakeX = poseShakeX
        }

        const matrix = transformManager
          .createIdentityMatrix()
          .translate([0, -BOX_CENTER_HEIGHT_UNITS, 0])
          .scaling([pose.scale, pose.scale, pose.scale])
          .rotate(pose.pitchRadians, [1, 0, 0])
          .rotate(pose.yawRadians, [0, 1, 0])
          .translate([poseShakeX, pose.isVisible ? pose.translateY : PARKED_HEIGHT, pose.translateZ])

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

      // Light from inside the opened box: the cushion and the inner side of the lid glow in the colour of the prize.
      const glowTargets = glowTargetsByCard[scene.focusedCardIndex]
      const glowStrength = computeGlowStrength(lidProgress, nowMilliseconds)

      if (glowTargets && Math.abs(glowStrength - lastGlowStrength.getBlocking()) > 0.002) {
        const [red, green, blue] = scene.glowColorLinear

        glowTargets.forEach(({ entity, primitiveIndex }) => {
          renderableManager
            .getMaterialInstanceAt(entity, primitiveIndex)
            .setFloat4Parameter('emissiveFactor', [red * glowStrength, green * glowStrength, blue * glowStrength, 1])
        })

        lastGlowStrength.setBlocking(glowStrength)
      }

      // The seams of the focused box light up in the colour of the prize.
      const seamEntities = seamEntitiesByCard[scene.focusedCardIndex]

      if (seamEntities && Math.abs(seamIntensity - lastSeamIntensity.getBlocking()) > 0.004) {
        const [red, green, blue] = scene.glowColorLinear
        const strength = seamIntensity * getRarityProfile(scene.rarityLevel).emissiveBoost

        seamEntities.forEach(seamEntity => {
          renderableManager
            .getMaterialInstanceAt(seamEntity, SEAM_PRIMITIVE_INDEX)
            .setFloat4Parameter('emissiveFactor', [red * strength, green * strength, blue * strength, 1])
        })

        lastSeamIntensity.setBlocking(seamIntensity)
      }

      updateSceneEffects({
        scene,
        nowMilliseconds,
        focusProgress,
        tuckProgress,
        seamIntensity,
        poses,
        focusedPose,
        shakeX,
      })
    },
    [
      transformManager,
      renderableManager,
      rootEntities,
      lidEntitiesByCard,
      glowTargetsByCard,
      scrollOffset,
      openingScene,
      dragState,
      tilt,
      pressState,
      entranceStartedAt,
      lastGlowStrength,
      seamEntitiesByCard,
      bodyTargetsByCard,
      lastIridescenceTints,
      looks,
      lastSeamIntensity,
      swayState,
      updateSceneEffects,
      viewportWidth,
      viewportHeight,
    ],
  )

  return { modelState: model.state }
}
