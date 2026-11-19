import { useMemo } from 'react'
import { Image, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { ZoomIn } from 'react-native-reanimated'

import { AppText } from '@components/AppText'
import { AppButton } from '@components/buttons/AppButton'
import type { IOpeningFacade } from '@flows/openingFlow/_types'
import { makeStyles } from '@flows/openingFlow/screens/OpeningOverlay/OpeningOverlay.styles'
import { theme } from '@utils/designSystem/Theme'

interface IOpeningOverlayProps {
  opening: IOpeningFacade
}

// Everything the user sees on top of the 3D box while it is opened: title, hint, errors, the one
// primary button and the revealed watch. The drag area under it turns the box.
export const OpeningOverlay = ({ opening }: IOpeningOverlayProps) => {
  const styles = useMemo(() => makeStyles(theme), [])
  const { reveal, primaryButton } = opening

  const renderReveal = () =>
    reveal ? (
      <Animated.View entering={ZoomIn.duration(550)} style={styles.reveal} testID="revealedWatch">
        <AppText style={styles.revealTitle}>{reveal.titleText}</AppText>
        <Image source={reveal.imageSource} style={styles.watchImage} resizeMode="contain" testID="revealedWatchImage" />
        <AppText style={styles.watchName} testID="revealedWatchName">
          {reveal.nameText}
        </AppText>
        <AppText style={styles.watchBrand}>{reveal.brandText}</AppText>
        <AppText style={styles.watchValue}>{reveal.valueText}</AppText>
      </Animated.View>
    ) : null

  return (
    <View style={styles.container} pointerEvents="box-none" testID="openingOverlay">
      <GestureDetector gesture={opening.panGesture}>
        <View style={styles.dragArea} testID="dragArea" />
      </GestureDetector>
      <View style={styles.header} pointerEvents="box-none">
        {opening.isBackVisible ? (
          <AppButton label={opening.backLabelText} onPress={opening.handleBackPress} testID="backButton" />
        ) : null}
        <View style={styles.titles} pointerEvents="none">
          <AppText style={styles.boxName} numberOfLines={1} testID="openingBoxName">
            {opening.boxNameText}
          </AppText>
          <AppText style={styles.price}>{opening.priceText}</AppText>
        </View>
      </View>
      {renderReveal()}
      <View style={styles.footer} pointerEvents="box-none">
        {opening.errorText ? (
          <AppText style={styles.error} testID="openingError">
            {opening.errorText}
          </AppText>
        ) : null}
        {opening.hintText ? (
          <AppText style={styles.hint} testID="openingHint">
            {opening.hintText}
          </AppText>
        ) : null}
        {primaryButton ? (
          <AppButton
            label={primaryButton.labelText}
            onPress={primaryButton.onPress}
            isDisabled={primaryButton.isDisabled}
            testID={primaryButton.testID}
          />
        ) : null}
      </View>
    </View>
  )
}
