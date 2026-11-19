import { FilamentAnimator, FilamentAsset, FilamentInstance } from '../types';
import { FilamentModel } from './useModel';
/**
 * Creates a animator for the given {@linkcode FilamentAsset} or {@linkcode FilamentInstance}.
 *
 * @note For each asset/instance you should only have one animator.
 */
export declare function useAnimator(modelOrAsset?: FilamentAsset | FilamentInstance | FilamentModel): FilamentAnimator | undefined;
