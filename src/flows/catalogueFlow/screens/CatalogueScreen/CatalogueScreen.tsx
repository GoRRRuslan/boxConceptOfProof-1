import { FlashList } from '@shopify/flash-list'
import { useMemo } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { FilamentScene } from 'react-native-filament'
import Animated from 'react-native-reanimated'

import { AppText } from '@components/AppText'
import { FadingView } from '@components/FadingView'
import { SceneVignette } from '@components/SceneVignette'
import { ScreenHeader } from '@components/ScreenHeader'
import { PerformanceOverlay } from '@components/PerformanceOverlay'
import { EPerformanceOverlayPlacement } from '@components/PerformanceOverlay/_types'
import { AppButton } from '@components/buttons/AppButton'
import { ScreenContainer } from '@components/_layout/ScreenContainer'
import { theme } from '@utils/designSystem/Theme'
import { CATALOGUE_SCENE_RENDER_PROPS } from '@flows/catalogueFlow/_config/sceneRenderConfig'
import { useCatalogueFacade } from '@flows/catalogueFlow/_facades/useCatalogueFacade'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import { BoxCard } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BoxCard'
import { CatalogueScene } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene'
import { makeStyles } from '@flows/catalogueFlow/screens/CatalogueScreen/CatalogueScreen.styles'
import { OpeningOverlay } from '@flows/openingFlow/screens/OpeningOverlay'

// The list's scroll events are handled on the UI thread (see the facade).
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as typeof FlashList

const CatalogueScreen = () => {
  const styles = useMemo(() => makeStyles(theme), [])

  // -------------------- Service hooks -------------------- //
  const {
    titleText,
    balanceLabelText,
    balanceInCents,
    loadingText,
    errorText,
    retryLabelText,
    resetBalanceLabelText,
    isLoadingBoxes,
    isSceneReady,
    sceneEpoch,
    isErrorBoxes,
    cards,
    viewport,
    listRef,
    sceneSync,
    opening,
    phaseKey,
    isRenderContinuous,
    isPerformanceOverlayVisible,
    renderCallback,
    renderFrameStats,
    isRenderPaused,
    handleListLayout,
    scrollHandler,
    handleListTouchStart,
    handleRetryPress,
    handleResetBalancePress,
    handleCardPressIn,
    handleCardPressOut,
  } = useCatalogueFacade()

  // --------------------- Render methods ------------------//
  const renderCard = ({ item, index }: { item: ICatalogueCard; index: number }) => (
    <BoxCard
      card={item}
      index={index}
      onPress={opening.handleCardPress}
      onPressIn={handleCardPressIn}
      onPressOut={handleCardPressOut}
    />
  )

  const renderScene = () => (
    <View style={styles.sceneLayer} pointerEvents="none">
      <FilamentScene key={sceneEpoch} {...CATALOGUE_SCENE_RENDER_PROPS}>
        <CatalogueScene
          cards={cards}
          viewport={viewport}
          sceneSync={sceneSync}
          phaseKey={phaseKey}
          isRenderContinuous={isRenderContinuous}
          renderCallback={renderCallback}
        />
      </FilamentScene>
    </View>
  )

  const renderList = () => (
    <AnimatedFlashList
      ref={listRef}
      data={cards}
      renderItem={renderCard}
      keyExtractor={card => card.identifier}
      onScroll={scrollHandler}
      onTouchStart={handleListTouchStart}
      scrollEventThrottle={16}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      testID="catalogueList"
    />
  )

  const renderStatus = () => {
    // The loader stays until the scene is ready: the boxes have popped in and the frames are steady.
    if (isLoadingBoxes || (!isSceneReady && !isErrorBoxes)) {
      return (
        <View style={styles.loadingOverlay} testID="catalogueLoading">
          <ActivityIndicator size="large" color={theme.Colors.accent} accessibilityLabel={loadingText} testID="catalogueLoadingIndicator" />
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
      <ScreenHeader
        titleText={titleText}
        trailingLabelText={balanceLabelText}
        trailingValueInCents={balanceInCents}
        actionLabelText={resetBalanceLabelText}
        onActionPress={handleResetBalancePress}
        testID="balanceHeader"
      />
      <View style={styles.listRegion} onLayout={handleListLayout}>
        {renderScene()}
        <SceneVignette />
        <FadingView isVisible={!opening.isListHidden && isSceneReady} style={styles.listLayer}>
          {renderList()}
        </FadingView>
        {opening.isOverlayVisible ? <OpeningOverlay opening={opening} /> : null}
        {renderStatus()}
      </View>
      {isPerformanceOverlayVisible && !opening.isOverlayVisible ? (
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
