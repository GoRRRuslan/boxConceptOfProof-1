import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

import type { IThemePalette } from '@utils/designSystem/Theme'

export const makeStyles = (theme: IThemePalette, topInset: number) =>
  ScaledSheet.create({
    container: {
      position: 'absolute',
      top: topInset + mvs(8),
      left: ms(12),
      paddingHorizontal: ms(8),
      paddingVertical: mvs(4),
      borderRadius: ms(8),
      backgroundColor: theme.Colors.background,
      opacity: 0.85,
    },
    text: {
      fontSize: ms(12),
      color: theme.Colors.accent,
    },
  })
