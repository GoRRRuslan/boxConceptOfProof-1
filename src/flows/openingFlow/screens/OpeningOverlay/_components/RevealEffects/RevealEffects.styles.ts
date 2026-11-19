import { ScaledSheet, ms, mvs } from 'react-native-size-matters'

export const makeStyles = (colorHex: string) =>
  ScaledSheet.create({
    glowContainer: {
      position: 'absolute',
      top: ms(-30),
      alignSelf: 'center',
      width: ms(300),
      height: ms(300),
      alignItems: 'center',
      justifyContent: 'center',
    },
    outerGlow: {
      position: 'absolute',
      width: ms(300),
      height: ms(300),
      borderRadius: ms(150),
      backgroundColor: colorHex,
    },
    innerGlow: {
      position: 'absolute',
      width: ms(210),
      height: ms(210),
      borderRadius: ms(105),
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
