import { FlashList } from '@shopify/flash-list'
import { useMemo } from 'react'

import { AppText } from '@components/AppText'
import { ScreenHeader } from '@components/ScreenHeader'
import { ScreenContainer } from '@components/_layout/ScreenContainer'
import { useCollectionFacade } from '@flows/collectionFlow/_facades/useCollectionFacade'
import type { ICollectionItem } from '@flows/collectionFlow/_types'
import { EmptyCollection } from '@flows/collectionFlow/screens/CollectionScreen/_components/EmptyCollection'
import { WatchListItem } from '@flows/collectionFlow/screens/CollectionScreen/_components/WatchListItem'
import { makeStyles } from '@flows/collectionFlow/screens/CollectionScreen/CollectionScreen.styles'
import { theme } from '@utils/designSystem/Theme'

const CollectionScreen = () => {
  const styles = useMemo(() => makeStyles(theme), [])

  // -------------------- Service hooks -------------------- //
  const {
    titleText,
    totalValueLabelText,
    totalValueText,
    countText,
    items,
    isEmpty,
    emptyTitleText,
    emptyDescriptionText,
    browseLabelText,
    handleBrowsePress,
  } = useCollectionFacade()

  // --------------------- Render methods ------------------//
  const renderItem = ({ item }: { item: ICollectionItem }) => <WatchListItem item={item} />

  const renderList = () => (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.ownershipIdentifier}
      ListHeaderComponent={
        <AppText style={styles.count} testID="collectionCount">
          {countText}
        </AppText>
      }
      showsVerticalScrollIndicator={false}
      testID="collectionList"
    />
  )

  return (
    <ScreenContainer withBottomInset={false} testID="collectionScreen">
      <ScreenHeader
        titleText={titleText}
        trailingLabelText={totalValueLabelText}
        trailingValueText={totalValueText}
        testID="collectionHeader"
      />
      {isEmpty ? (
        <EmptyCollection
          titleText={emptyTitleText}
          descriptionText={emptyDescriptionText}
          browseLabelText={browseLabelText}
          onBrowsePress={handleBrowsePress}
        />
      ) : (
        renderList()
      )}
    </ScreenContainer>
  )
}

export default CollectionScreen
