import { PropsWithChildren } from 'react';
import { EngineProps } from '../hooks/useEngine';
import React from 'react';
import { RendererConfigProps, ViewConfigProps } from './Configurator';
export type FilamentProviderProps = PropsWithChildren<Omit<EngineProps, 'runtime'> & ViewConfigProps & RendererConfigProps & {
    fallback?: React.ReactElement;
}>;
export declare function FilamentScene({ children, fallback, config, backend, frameRateOptions, ...viewProps }: FilamentProviderProps): React.JSX.Element | null;
