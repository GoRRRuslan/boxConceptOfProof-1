import { useMemo } from 'react'
import { View } from 'react-native'

import { AppText } from '@components/AppText'
import { makeStyles } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BalanceHeader/BalanceHeader.styles'
import { theme } from '@utils/designSystem/Theme'

interface IBalanceHeaderProps {
  titleText: string
  balanceLabelText: string
  balanceText: string
}

export const BalanceHeader = ({ titleText, balanceLabelText, balanceText }: IBalanceHeaderProps) => {
  const styles = useMemo(() => makeStyles(theme), [])

  return (
    <View style={styles.container} testID="balanceHeader">
      <AppText style={styles.title}>{titleText}</AppText>
      <View style={styles.balance}>
        <AppText style={styles.balanceLabel}>{balanceLabelText}</AppText>
        <AppText style={styles.balanceAmount} testID="balanceText">
          {balanceText}
        </AppText>
      </View>
    </View>
  )
}
