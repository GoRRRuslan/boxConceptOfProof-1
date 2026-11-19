import React, { PropsWithChildren } from 'react';
import { PublicNativeProps } from './FilamentView';
import { RenderCallback } from '../types';
import { ViewStyle } from 'react-native';
type ForwardProps = PublicNativeProps & {
    style?: ViewStyle;
    renderCallback?: RenderCallback;
};
/**
 * This is the component actually exposed to the user. It wraps the `FilamentView` and adds the renderCallbacks.
 * @private
 */
export declare function FilamentViewWithRenderCallbacks({ children, renderCallback: renderCallbackProp, ...forwardProps }: PropsWithChildren<ForwardProps>): React.JSX.Element;
export {};
