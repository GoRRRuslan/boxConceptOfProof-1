import { FilamentBuffer } from '../native/FilamentBuffer';
export type SkyboxBaseOptions = {
    showSun?: boolean;
    envIntensity?: number;
};
export type SkyboxOptions = SkyboxBaseOptions & ({
    color: string;
} | {
    texture: FilamentBuffer;
});
/**
 * Creates and sets the skybox for the scene depending on the options provided.
 * If `null` is passed, the skybox will be removed.
 */
export declare function useSkybox(options?: SkyboxOptions | null): void;
