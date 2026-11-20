import type { SharedValue } from 'react-native-reanimated';
import { LightConfig, LightManager } from '../types';
export type UseLightEntityProps = LightConfig | (Omit<LightConfig, 'intensity' | 'colorKelvin'> & {
    intensity?: number | SharedValue<number>;
    colorKelvin?: number | SharedValue<number>;
});
/**
 * Creates a new memoized light entity based on the given configuration.
 */
export declare function useLightEntity(lightManager: LightManager, config: UseLightEntityProps): import("../types").Entity;
