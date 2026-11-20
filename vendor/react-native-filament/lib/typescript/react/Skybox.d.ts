import React from 'react';
import { BufferSource } from '../hooks/useBuffer';
export type BaseProps = {
    /**
     * Indicates whether the sun should be rendered. The sun can only be
     * rendered if there is at least one light of type SUN in the scene.
     * @default false
     */
    showSun?: boolean;
    /**
     * Skybox intensity when no IndirectLight is set on the Scene.
     * This call is ignored when an IndirectLight is set on the Scene, and the intensity
     * of the IndirectLight is used instead.
     * Scale factor applied to the skybox texel values such that
     * the result is in lux, or lumen/m^2 (default = 30000)
     */
    envIntensity?: number;
};
export type TextureProps = BaseProps & {
    /**
     * The image to use as the skybox.
     */
    source: BufferSource;
};
export type ColorProps = BaseProps & {
    /**
     * The color of the skybox.
     * @example #ff0000
     */
    colorInHex: string;
};
export type SkyboxProps = TextureProps | ColorProps;
export declare function Skybox(props: SkyboxProps): React.JSX.Element;
