import { BufferSource } from '../hooks/useBuffer';
export type EnvironmentalLightProps = {
    /**
     * The image to use as the environmental light. Expects a ktx file.
     */
    source: BufferSource;
    /**
     * @default 30_000
     */
    intensity?: number;
    /**
     * Number of spherical harmonics bands. Must be 1, 2 or 3.
     * @default 3
     */
    irradianceBands?: number;
};
/**
 * Sets the light of the scene. An environmental light uses an image file to simulate indirect light.
 * @note You can only have one environmental light in the scene.
 */
export declare function EnvironmentalLight({ source, intensity, irradianceBands }: EnvironmentalLightProps): null;
