import type { ImageSourcePropType } from 'react-native'

export interface ICollectionItem {
  ownershipIdentifier: string
  nameText: string
  brandText: string
  valueText: string
  // Which box it came from; null while the boxes are not loaded (nothing is guessed).
  boxText: string | null
  thumbnailSource: ImageSourcePropType
}

export interface ICollectionFacade {
  titleText: string
  totalValueLabelText: string
  totalValueText: string
  countText: string
  items: ICollectionItem[]
  isEmpty: boolean
  emptyTitleText: string
  emptyDescriptionText: string
  browseLabelText: string
  handleBrowsePress: () => void
}
