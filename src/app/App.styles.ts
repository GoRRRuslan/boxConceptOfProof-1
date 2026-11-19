import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

import type { IThemePalette } from '@utils/designSystem/Theme'

export const makeStyles = (theme: IThemePalette) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.Colors.background,
      paddingHorizontal: ms(24),
    },
    title: {
      color: theme.Colors.textPrimary,
      fontSize: ms(28),
      fontWeight: '700',
    },
    subtitle: {
      marginTop: mvs(8),
      color: theme.Colors.textSecondary,
      fontSize: ms(14),
    },
  })
