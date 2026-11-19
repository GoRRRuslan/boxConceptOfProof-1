import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAdapterCollectionItems } from '@flows/collectionFlow/_adapters/useAdapterCollectionItems'
import { computeCollectionValue } from '@flows/collectionFlow/_facadesLogic/computeCollectionValue'
import type { ICollectionFacade } from '@flows/collectionFlow/_types'
import useStore from '@models/mainStorage/_storeConfigured'
import { ETabRoute, type TTabParamList } from '@navigation/_types'
import { useGetBoxesQuery } from '@networking/requests/queries/BoxQueries/useGetBoxesQuery'
import { formatCurrency } from '@utils/formatCurrency'

export const useCollectionFacade = (): ICollectionFacade => {
  const { t } = useTranslation()

  // ------------------------ Navigation ----------------------- //
  const navigation = useNavigation<BottomTabNavigationProp<TTabParamList>>()

  // --------------------------- Store ------------------------- //
  const ownedWatches = useStore(state => state.ownedWatches)

  // ----------------------- Queries / mutations -------------------- //
  const { boxesData } = useGetBoxesQuery()

  // -------------------------- Adapter ------------------------- //
  const items = useAdapterCollectionItems({ ownedWatches, boxesData })

  // -------------------------- Values ------------------------- //
  const totalValueText = useMemo(() => formatCurrency(computeCollectionValue(ownedWatches)), [ownedWatches])

  // ------------------- Handlers -------------------------- //
  const handleBrowsePress = () => {
    navigation.navigate(ETabRoute.Catalogue)
  }

  return {
    titleText: t('collection.title'),
    totalValueLabelText: t('collection.totalValue'),
    totalValueText,
    countText: t('collection.count', { count: ownedWatches.length }),
    items,
    isEmpty: ownedWatches.length === 0,
    emptyTitleText: t('collection.emptyTitle'),
    emptyDescriptionText: t('collection.emptyDescription'),
    browseLabelText: t('collection.browse'),
    handleBrowsePress,
  }
}
