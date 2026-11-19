import { DependencyList } from 'react';
import { PointerHolder } from '../types/PointerHolder';
type ReleasingResource = Pick<PointerHolder, 'release'>;
/**
 * Any resource that is a {@link PointerHolder} and can be released, should be loaded
 * using this hook. It takes care of properly releasing the resource when the component
 * unmounts or dependencies change.
 * There are certain cases like "fast refresh" or StrictMode that make useEffects execute
 * multiple times. Also loading the resource can be async and this hooks handles all these
 * cases properly.
 */
export declare const useDisposableResource: <T extends ReleasingResource>(initialize: () => Promise<T | undefined> | undefined, deps?: DependencyList) => T | undefined;
export {};
