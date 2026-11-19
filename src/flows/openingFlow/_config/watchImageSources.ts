import type { ImageSourcePropType } from 'react-native'

import casioImage from '@assets/images/watches/full/casio.webp'
import gmtImage from '@assets/images/watches/full/gmt.webp'
import perpetualImage from '@assets/images/watches/full/perpetual.webp'
import skyDwellerImage from '@assets/images/watches/full/sky-dweller.webp'
import { EWatchIdentifier } from '@networking/api/MysteryBoxApi/_types'

export const WATCH_IMAGE_SOURCES: Record<EWatchIdentifier, ImageSourcePropType> = {
  [EWatchIdentifier.Casio]: casioImage,
  [EWatchIdentifier.Gmt]: gmtImage,
  [EWatchIdentifier.Perpetual]: perpetualImage,
  [EWatchIdentifier.SkyDweller]: skyDwellerImage,
}
