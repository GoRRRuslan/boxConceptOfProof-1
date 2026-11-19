import { useMemo } from 'react'
import { Image, View } from 'react-native'

import { AppText } from '@components/AppText'
import type { ICollectionItem } from '@flows/collectionFlow/_types'
import { makeStyles } from '@flows/collectionFlow/screens/CollectionScreen/_components/WatchListItem/WatchListItem.styles'
import { theme } from '@utils/designSystem/Theme'

interface IWatchListItemProps {
  item: ICollectionItem
}

export const WatchListItem = ({ item }: IWatchListItemProps) => {
  const styles = useMemo(() => makeStyles(theme), [])

  return (
    <View style={styles.row} testID={`collectionItem-${item.ownershipIdentifier}`}>
      <Image source={item.thumbnailSource} style={styles.thumbnail} resizeMode="contain" />
      <View style={styles.texts}>
        <AppText style={styles.name}>{item.nameText}</AppText>
        <AppText style={styles.brand}>{item.brandText}</AppText>
        {item.boxText ? <AppText style={styles.box}>{item.boxText}</AppText> : null}
      </View>
      <AppText style={styles.value}>{item.valueText}</AppText>
    </View>
  )
}
