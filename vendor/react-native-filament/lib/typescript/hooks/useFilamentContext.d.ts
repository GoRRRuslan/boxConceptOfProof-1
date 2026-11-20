import React from 'react';
import { RNFCamera, Choreographer, Engine, LightManager, NameComponentManager, RenderableManager, Renderer, Scene, TransformManager, View } from '../types';
import type { WorkletRuntime } from 'react-native-worklets';
export type FilamentContextType = {
    engine: Engine;
    transformManager: TransformManager;
    renderableManager: RenderableManager;
    scene: Scene;
    lightManager: LightManager;
    view: View;
    camera: RNFCamera;
    renderer: Renderer;
    nameComponentManager: NameComponentManager;
    workletRuntime: WorkletRuntime;
    /**
     * This is a private API, do not use this.
     * @private
     * @internal
     */
    choreographer: Choreographer;
};
export declare const FilamentContext: React.Context<FilamentContextType | undefined>;
export declare function useFilamentContext(): FilamentContextType;
