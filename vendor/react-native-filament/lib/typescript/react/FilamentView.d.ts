import React from 'react';
import { type NativeProps } from '../native/specs/FilamentViewNativeComponent';
import { FilamentContext } from '../hooks/useFilamentContext';
import { RenderCallback } from 'react-native-filament';
export type PublicNativeProps = Omit<NativeProps, 'onViewReady'>;
export interface FilamentProps extends PublicNativeProps {
    /**
     * This function will be called every frame. You can use it to update your scene.
     *
     * @note Don't call any methods on `engine` here - this will lead to deadlocks!
     */
    renderCallback: RenderCallback;
}
/**
 * The component that actually renders the native view and displays our content (think of it as canvas).
 */
export declare class FilamentView extends React.PureComponent<FilamentProps> {
    private readonly ref;
    private surfaceCreatedListener;
    private surfaceDestroyedListener;
    private renderCallbackListener;
    private swapChain;
    private view;
    private isSurfaceAlive;
    private isComponentMounted;
    private viewId;
    /**
     * Uses the context in class.
     * @note Not available in the constructor!
     */
    static contextType: React.Context<import("../hooks/useFilamentContext").FilamentContextType | undefined>;
    context: React.ContextType<typeof FilamentContext>;
    constructor(props: FilamentProps);
    private get handle();
    private updateTransparentRendering;
    private latestToken;
    private updateRenderCallback;
    private getContext;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<FilamentProps>): void;
    /**
     * Calling this signals that this FilamentView will be removed, and it should release all its resources and listeners.
     */
    cleanupResources(): void;
    componentWillUnmount(): void;
    private onViewReady;
    private onSurfaceCreated;
    /**
     * On surface destroyed might be called multiple times for the same native view (FilamentView).
     * On android if a surface is destroyed, it can be recreated, while the view stays alive.
     */
    private onSurfaceDestroyed;
    /**
     * Pauses the rendering of the Filament view.
     */
    pause: () => void;
    /**
     * Resumes the rendering of the Filament view.
     * It's a no-op if the rendering is already running.
     */
    resume: () => void;
    private onTouchStart;
    /** @internal */
    render(): React.ReactNode;
}
