import { Float4, TextureFlags, TransformationProps } from '../types';
import React from 'react';
import { FilamentBuffer } from '../native/FilamentBuffer';
export type SelectorProps = {
    byName: string;
} | {
    byIndex: number;
};
export type TextureMap = {
    materialName: string;
    textureSource: FilamentBuffer;
    textureFlags?: TextureFlags;
};
export type MaterialParameterValue = {
    baseColorFactor?: Float4;
    emissiveFactor?: Float4;
    roughnessFactor?: number;
    metallicFactor?: number;
    reflectance?: number;
    clearCoatFactor?: number;
    clearCoatRoughnessFactor?: number;
};
export type MaterialParametersItem = {
    index: number;
    parameters: MaterialParameterValue;
};
export type MaterialParameters = MaterialParametersItem | MaterialParametersItem[];
export type ModifierProps = TransformationProps & {
    textureMap?: TextureMap;
    materialParameters?: MaterialParameters;
};
export type EntitySelectorProps = SelectorProps & ModifierProps;
export declare function EntitySelector(props: EntitySelectorProps): React.JSX.Element;
