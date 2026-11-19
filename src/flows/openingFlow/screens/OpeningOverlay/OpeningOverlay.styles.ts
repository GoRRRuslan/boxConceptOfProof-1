import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

import type { IThemePalette } from '@utils/designSystem/Theme'

export const makeStyles = (theme: IThemePalette, rarityColorHex: string) =>
  ScaledSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'space-between',
    },
    dragArea: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ms(16),
      paddingTop: mvs(8),
    },
    titles: {
      flex: 1,
      alignItems: 'center',
    },
    boxName: {
      fontSize: ms(18),
      fontWeight: '700',
    },
    price: {
      fontSize: ms(14),
      color: theme.Colors.accent,
    },
    reveal: {
      position: 'absolute',
      top: mvs(52),
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    revealTitle: {
      fontSize: ms(14),
      color: theme.Colors.textSecondary,
    },
    revealTexts: {
      alignItems: 'center',
    },
    rarity: {
      fontSize: ms(15),
      fontWeight: '800',
      letterSpacing: 1,
      color: rarityColorHex,
    },
    watchName: {
      fontSize: ms(22),
      fontWeight: '700',
    },
    watchBrand: {
      fontSize: ms(14),
      color: theme.Colors.textSecondary,
    },
    watchValue: {
      fontSize: ms(16),
      fontWeight: '600',
      color: theme.Colors.accent,
    },
    footer: {
      alignItems: 'center',
      gap: ms(8),
      paddingHorizontal: ms(24),
      paddingBottom: mvs(20),
    },
    hint: {
      fontSize: ms(14),
      color: theme.Colors.textSecondary,
    },
    error: {
      fontSize: ms(14),
      textAlign: 'center',
      color: theme.Colors.danger,
    },
  })
