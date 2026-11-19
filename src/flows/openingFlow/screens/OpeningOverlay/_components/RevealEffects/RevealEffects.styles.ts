import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

export const makeStyles = (colorHex: string) =>
  ScaledSheet.create({
    glowContainer: {
      position: 'absolute',
      // Centred on the watch image and smaller than it is tall: the glow touches neither "You got" above nor the texts below.
      top: ms(28),
      alignSelf: 'center',
      width: ms(184),
      height: ms(184),
      alignItems: 'center',
      justifyContent: 'center',
    },
    outerGlow: {
      position: 'absolute',
      width: ms(184),
      height: ms(184),
      borderRadius: ms(92),
      backgroundColor: `${colorHex}22`,
      // A crisp ring in the rarity colour outlines the glow, so the (often silver) watch never melts into it.
      borderWidth: ms(2),
      borderColor: colorHex,
    },
    innerGlow: {
      position: 'absolute',
      width: ms(130),
      height: ms(130),
      borderRadius: ms(65),
      backgroundColor: colorHex,
    },
    flash: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: '#FFFFFF',
    },
    // Particles fly out from the middle of the watch image.
    particleOrigin: {
      position: 'absolute',
      // Middle of the watch image: the reveal block starts at mvs(52), the title above the image is about ms(20).
      top: mvs(52) + ms(120),
      alignSelf: 'center',
      width: 1,
      height: 1,
    },
  })
