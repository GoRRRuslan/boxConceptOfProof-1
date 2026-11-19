import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

import type { IThemePalette } from '@utils/designSystem/Theme'

export const makeStyles = (theme: IThemePalette) =>
  ScaledSheet.create({
    sceneContainer: {
      flex: 1,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(16),
      paddingTop: mvs(12),
    },
    angleText: {
      color: theme.Colors.textPrimary,
    },
  })
