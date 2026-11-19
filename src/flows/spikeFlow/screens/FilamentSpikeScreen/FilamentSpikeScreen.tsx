import { useMemo } from 'react'
import { View } from 'react-native'
import { FilamentScene } from 'react-native-filament'

import { ScreenContainer } from '@components/_layout/ScreenContainer'
import { AppButton } from '@components/buttons/AppButton'
import { AppText } from '@components/AppText'
import { useFilamentSpikeFacade } from '@flows/spikeFlow/_facades/useFilamentSpikeFacade'
import { SpikeScene } from '@flows/spikeFlow/screens/FilamentSpikeScreen/_components/SpikeScene'
import { makeStyles } from '@flows/spikeFlow/screens/FilamentSpikeScreen/FilamentSpikeScreen.styles'
import { theme } from '@utils/designSystem/Theme'

const FilamentSpikeScreen = () => {
  const styles = useMemo(() => makeStyles(theme), [])

  // -------------------- Service hooks -------------------- //
  const {
    lidHingeTransform,
    modelCount,
    angleLabelText,
    modelCountLabelText,
    openLabelText,
    closeLabelText,
    decreaseLabelText,
    increaseLabelText,
    handleOpenPress,
    handleClosePress,
    handleIncreasePress,
    handleDecreasePress,
    handleToggleModelCountPress,
  } = useFilamentSpikeFacade()

  // --------------------- Render methods ------------------//
  const renderScene = () => (
    <View style={styles.sceneContainer}>
      <FilamentScene>
        <SpikeScene lidHingeTransform={lidHingeTransform} modelCount={modelCount} />
      </FilamentScene>
    </View>
  )

  const renderModelCountControl = () => (
    <View style={styles.controls}>
      <AppButton label={modelCountLabelText} onPress={handleToggleModelCountPress} testID="toggleModelCountButton" />
    </View>
  )

  const renderLidControls = () => (
    <View style={styles.controls}>
      <AppButton label={closeLabelText} onPress={handleClosePress} testID="closeLidButton" />
      <AppButton label={decreaseLabelText} onPress={handleDecreasePress} testID="decreaseLidButton" />
      <AppText style={styles.angleText} testID="lidAngleLabel">
        {angleLabelText}
      </AppText>
      <AppButton label={increaseLabelText} onPress={handleIncreasePress} testID="increaseLidButton" />
      <AppButton label={openLabelText} onPress={handleOpenPress} testID="openLidButton" />
    </View>
  )

  return (
    <ScreenContainer testID="filamentSpikeScreen">
      {renderScene()}
      {renderModelCountControl()}
      {renderLidControls()}
    </ScreenContainer>
  )
}

export default FilamentSpikeScreen
