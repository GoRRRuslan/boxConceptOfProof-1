import React from 'react';
import { ViewProps } from 'react-native';
type Handler = Required<ViewProps>['onTouchStart'];
/**
 * Internal context for holding touch handlers which will be invoked on the FilamentView.
 * @private
 */
export declare const TouchHandlerContext: React.Context<{
    touchHandlers: Record<number, ViewProps>;
    addTouchHandler: (handler: Handler) => () => void;
}>;
export declare const getTouchHandlers: () => Record<number, ViewProps>;
export {};
