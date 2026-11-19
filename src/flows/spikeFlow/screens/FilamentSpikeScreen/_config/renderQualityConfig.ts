import type { FilamentProviderProps } from 'react-native-filament'

export enum ERenderQualityProfile {
  Full = 'full',
  Balanced = 'balanced',
  Performance = 'performance',
}

type TRenderQualityProps = Pick<
  FilamentProviderProps,
  'antiAliasing' | 'shadowing' | 'dithering' | 'postProcessing' | 'dynamicResolutionOptions' | 'bloomOptions'
>

// Quality knobs of the shared Filament view. `full` is for the opening screen, the cheaper
// profiles are for the scrolling catalogue (many boxes, small on screen).
export const RENDER_QUALITY_PROFILES: Record<ERenderQualityProfile, TRenderQualityProps> = {
  [ERenderQualityProfile.Full]: {
    antiAliasing: 'FXAA',
    shadowing: true,
    dithering: 'temporal',
    postProcessing: true,
  },
  [ERenderQualityProfile.Balanced]: {
    antiAliasing: 'FXAA',
    shadowing: false,
    dithering: 'temporal',
    postProcessing: true,
    dynamicResolutionOptions: { enabled: true, minScale: [0.75, 0.75], maxScale: [0.75, 0.75], quality: 'MEDIUM' },
  },
  [ERenderQualityProfile.Performance]: {
    antiAliasing: 'none',
    shadowing: false,
    dithering: 'none',
    postProcessing: true,
    dynamicResolutionOptions: { enabled: true, minScale: [0.5, 0.5], maxScale: [0.5, 0.5], quality: 'MEDIUM' },
  },
}

export const RENDER_QUALITY_PROFILE_ORDER: ERenderQualityProfile[] = [
  ERenderQualityProfile.Full,
  ERenderQualityProfile.Balanced,
  ERenderQualityProfile.Performance,
]
