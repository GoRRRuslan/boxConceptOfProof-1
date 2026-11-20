import React, { ReactNode } from 'react';
import { BufferSource } from '../hooks/useBuffer';
import { FilamentModel, UseModelConfigParams } from '../hooks/useModel';
import { Entity } from '../types';
import { TransformationProps } from '../types/TransformProps';
export type LoadModelProps = UseModelConfigParams & {
    source: BufferSource;
};
export type UIProps = TransformationProps & {
    /**
     * Will be called when the user pressed any of the rendered entities of the model.
     */
    onPress?: (entity: Entity, modelEntities: Entity[]) => void;
    children?: ReactNode | undefined;
    /**
     * @default false
     */
    castShadow?: boolean;
    /**
     * @default false
     */
    receiveShadow?: boolean;
};
export type ModelProps = LoadModelProps & UIProps;
/**
 * Loads a model from the given source.
 *
 *
 * If you are passing in a `.glb` model or similar from your app's bundle using `require(..)`, make sure to add `glb` as an asset extension to `metro.config.js`!
 * If you are passing in a `{ uri: ... }`, make sure the URL points directly to a `.glb` model. This can either be a web URL (`http://..`/`https://..`), a local file (`file://..`), or an native asset path (`path/to/asset.glb`)
 */
export declare function Model({ source, ...restProps }: ModelProps): React.JSX.Element;
export type ModelRendererProps = {
    /**
     * The model to render obtained by the `useModel` hook.
     */
    model: FilamentModel;
} & UIProps;
/**
 * Renders a model that was loaded with `useModel`.
 * Always prefer the `Model` component, except when you explicitly need to access the model instance imperatively.
 */
export declare function ModelRenderer({ model, onPress, children, ...restProps }: ModelRendererProps): React.JSX.Element | null;
