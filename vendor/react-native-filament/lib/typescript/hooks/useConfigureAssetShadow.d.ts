import { FilamentAsset, RenderableManager } from '../types';
export type UseAssetShadowProps = {
    renderableManager: RenderableManager;
    asset?: FilamentAsset;
    /**
     * @default false
     */
    receiveShadow?: boolean;
    /**
     * @default false
     */
    castShadow?: boolean;
};
export declare function useConfigureAssetShadow({ renderableManager, asset, receiveShadow, castShadow }: UseAssetShadowProps): void;
