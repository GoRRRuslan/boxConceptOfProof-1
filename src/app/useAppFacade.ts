import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { theme } from '@utils/designSystem/Theme'
import { queryClient } from '@services/reactQuery/queryClient'

export const useAppFacade = () => {
  const { t } = useTranslation()

  // -------------------------- Values ------------------------- //
  const titleText = useMemo(() => t('app.title'), [t])
  const subtitleText = useMemo(() => t('app.stageZeroSubtitle'), [t])

  return { theme, queryClient, titleText, subtitleText }
}
