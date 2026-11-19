import { useMemo } from 'react'
import { Pressable } from 'react-native'

import { AppText } from '@components/AppText'
import { makeStyles } from '@components/buttons/AppButton/AppButton.styles'
import { theme } from '@utils/designSystem/Theme'

interface IAppButtonProps {
  label: string
  onPress: () => void
  testID: string
}

export const AppButton = ({ label, onPress, testID }: IAppButtonProps) => {
  const styles = useMemo(() => makeStyles(theme), [])

  return (
    <Pressable style={styles.button} onPress={onPress} testID={testID}>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  )
}
