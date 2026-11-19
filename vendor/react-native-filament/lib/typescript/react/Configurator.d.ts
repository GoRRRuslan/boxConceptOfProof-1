import { PropsWithChildren } from 'react';
import { AmbientOcclusionOptions, DynamicResolutionOptions, FrameRateOptions, TemporalAntiAliasingOptions, View } from '../types';
export type ViewConfigProps = Partial<Pick<View, 'antiAliasing' | 'screenSpaceRefraction' | 'postProcessing' | 'dithering' | 'shadowing'>> & {
    ambientOcclusionOptions?: AmbientOcclusionOptions;
    dynamicResolutionOptions?: DynamicResolutionOptions;
    bloomOptions?: import('../types').BloomOptions;
    temporalAntiAliasingOptions?: TemporalAntiAliasingOptions;
};
export type RendererConfigProps = {
    frameRateOptions?: FrameRateOptions;
};
export type ConfiguratorProps = PropsWithChildren<{
    rendererProps?: RendererConfigProps;
    viewProps: ViewConfigProps;
}>;
/**
 * Takes configurations as props and applies them using the imperative API.
 * Needs to have a valid `FilamentScene` in the tree.
 *
 * @private
 */
export declare function Configurator({ rendererProps, viewProps, children }: ConfiguratorProps): import("react").ReactNode;
