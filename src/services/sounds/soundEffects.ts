import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'

import errorSound from '@assets/sounds/error.wav'
import anticipationSound from '@assets/sounds/anticipation.wav'
import lidOpenSound from '@assets/sounds/lidOpen.wav'
import purchaseSound from '@assets/sounds/purchase.wav'
import revealCommonSound from '@assets/sounds/revealCommon.wav'
import revealLegendarySound from '@assets/sounds/revealLegendary.wav'
import revealRareSound from '@assets/sounds/revealRare.wav'
import selectSound from '@assets/sounds/select.wav'

export enum ESoundEffect {
  Select = 'select',
  Purchase = 'purchase',
  Anticipation = 'anticipation',
  LidOpen = 'lidOpen',
  RevealCommon = 'revealCommon',
  RevealRare = 'revealRare',
  RevealLegendary = 'revealLegendary',
  Error = 'error',
}

const SOURCES: Record<ESoundEffect, number> = {
  [ESoundEffect.Select]: selectSound,
  [ESoundEffect.Purchase]: purchaseSound,
  [ESoundEffect.Anticipation]: anticipationSound,
  [ESoundEffect.LidOpen]: lidOpenSound,
  [ESoundEffect.RevealCommon]: revealCommonSound,
  [ESoundEffect.RevealRare]: revealRareSound,
  [ESoundEffect.RevealLegendary]: revealLegendarySound,
  [ESoundEffect.Error]: errorSound,
}

const players = new Map<ESoundEffect, AudioPlayer>()
let isAudioModeConfigured = false

const getPlayer = (effect: ESoundEffect): AudioPlayer => {
  if (!isAudioModeConfigured) {
    isAudioModeConfigured = true

    // Effects are short UI sounds: they play even with the silent switch on and do not stop other audio.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => undefined)
  }

  const existingPlayer = players.get(effect)

  if (existingPlayer) {
    return existingPlayer
  }

  const player = createAudioPlayer(SOURCES[effect])

  players.set(effect, player)

  return player
}

// Short sound effects. A device or simulator without audio must never break the app: failures are swallowed.
export const soundEffects = {
  play: (effect: ESoundEffect) => {
    try {
      const player = getPlayer(effect)

      void player.seekTo(0)

      player.play()
    } catch {
      // No audio output available: the app works the same without sound.
    }
  },
}
