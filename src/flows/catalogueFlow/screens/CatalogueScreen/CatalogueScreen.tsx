import { FlashList } from '@shopify/flash-list'
import { useMemo } from 'react'
import { View } from 'react-native'
import { FilamentScene } from 'react-native-filament'

import { AppText } from '@components/AppText'
import { PerformanceOverlay } from '@components/PerformanceOverlay'
import { EPerformanceOverlayPlacement } from '@components/PerformanceOverlay/_types'
import { AppButton } from '@components/buttons/AppButton'
import { ScreenContainer } from '@components/_layout/ScreenContainer'
import { useCatalogueFacade } from '@flows/catalogueFlow/_facades/useCatalogueFacade'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import { BalanceHeader } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BalanceHeader'
import { BoxCard } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BoxCard'
import { CatalogueScene } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene'
import { makeStyles } from '@flows/catalogueFlow/screens/CatalogueScreen/CatalogueScreen.styles'

const CatalogueScreen = () => {
  const styles = useMemo(() => makeStyles(), [])

  // -------------------- Service hooks -------------------- //
  const {
    titleText,
    balanceLabelText,
    balanceText,
    loadingText,
    errorText,
    retryLabelText,
    isLoadingBoxes,
    isErrorBoxes,
    cards,
    viewport,
    listRef,
    scrollOffset,
    isScrolling,
    isPerformanceOverlayVisible,
    renderCallback,
    renderFrameStats,
    isRenderPaused,
    handleListLayout,
    handleScroll,
    handleRetryPress,
  } = useCatalogueFacade()

  // --------------------- Render methods ------------------//
  const renderCard = ({ item }: { item: ICatalogueCard }) => <BoxCard card={item} />

  const renderScene = () => (
    <View style={styles.sceneLayer} pointerEvents="none">
      <FilamentScene>
        <CatalogueScene
          cards={cards}
          viewport={viewport}
          scrollOffset={scrollOffset}
          isScrolling={isScrolling}
          renderCallback={renderCallback}
        />
      </FilamentScene>
    </View>
  )

  const renderList = () => (
    <FlashList
      ref={listRef}
      data={cards}
      renderItem={renderCard}
      keyExtractor={card => card.identifier}
      onScroll={handleScroll}
      scrollEventThrottle={1}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      testID="catalogueList"
    />
  )

  const renderStatus = () => {
    if (isLoadingBoxes) {
      return (
        <View style={styles.status} testID="catalogueLoading">
          <AppText>{loadingText}</AppText>
        </View>
      )
    }

    if (isErrorBoxes) {
      return (
        <View style={styles.status} testID="catalogueError">
          <AppText>{errorText}</AppText>
          <AppButton label={retryLabelText} onPress={handleRetryPress} testID="retryButton" />
        </View>
      )
    }

    return null
  }

  return (
    <ScreenContainer testID="catalogueScreen">
      <BalanceHeader titleText={titleText} balanceLabelText={balanceLabelText} balanceText={balanceText} />
      <View style={styles.listRegion} onLayout={handleListLayout}>
        {renderScene()}
        {renderList()}
        {renderStatus()}
      </View>
      {isPerformanceOverlayVisible ? (
        <PerformanceOverlay
          renderFrameStats={renderFrameStats}
          isRenderPaused={isRenderPaused}
          placement={EPerformanceOverlayPlacement.Bottom}
        />
      ) : null}
    </ScreenContainer>
  )
}

export default CatalogueScreen
