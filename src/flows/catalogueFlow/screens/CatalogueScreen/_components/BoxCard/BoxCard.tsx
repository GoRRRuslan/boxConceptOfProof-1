import { useMemo } from 'react'
import { View } from 'react-native'

import { AppText } from '@components/AppText'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import { makeStyles } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BoxCard/BoxCard.styles'
import { theme } from '@utils/designSystem/Theme'

interface IBoxCardProps {
  card: ICatalogueCard
}

// A card is transparent on top (the 3D box shows through the slot) with the box facts below it.
export const BoxCard = ({ card }: IBoxCardProps) => {
  const styles = useMemo(() => makeStyles(theme), [])

  return (
    <View style={styles.card} testID={`boxCard-${card.identifier}`}>
      <View style={styles.boxSlot} />
      <View style={styles.info}>
        <AppText style={styles.name}>{card.name}</AppText>
        <AppText style={card.isAffordable ? styles.price : styles.priceUnaffordable} testID={`boxPrice-${card.identifier}`}>
          {card.priceText}
        </AppText>
        <AppText style={styles.prize}>{card.prizeText}</AppText>
        {card.affordabilityText ? (
          <AppText style={styles.affordability} testID={`boxAffordability-${card.identifier}`}>
            {card.affordabilityText}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}
