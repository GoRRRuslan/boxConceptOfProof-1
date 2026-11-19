import { type BufferSource } from './useBuffer';
import { FilamentAsset } from '../types/FilamentAsset';
import { AABB, Entity } from '../types';
export interface UseModelConfigParams {
    /**
     * Whether source data of the model should be released after loading, or not.
     * @default true
     */
    shouldReleaseSourceData?: boolean;
    /**
     * Whether the model should be added to the scene.
     * @default true
     */
    addToScene?: boolean;
    /**
     * Number of instances to create.
     * @default 1
     */
    instanceCount?: number;
}
/**
 * The resulting filament model, or `'loading'` if not yet available.
 */
export type FilamentModel = {
    state: 'loaded';
    asset: FilamentAsset;
    boundingBox: AABB;
    /**
     * The root entity of the model.
     */
    rootEntity: Entity;
} | {
    state: 'loading';
};
/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ url: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 *
 * @worklet
 * @example
 * ```ts
 * const model = useModel(require('model.glb'))
 * ```
 */
export declare function useModel(source: BufferSource, props?: UseModelConfigParams): FilamentModel;
