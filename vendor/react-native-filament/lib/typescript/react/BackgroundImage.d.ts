import { BufferSource } from '../hooks/useBuffer';
export type BackgroundImageProps = {
    source: BufferSource;
    materialSource: BufferSource;
    resizeMode?: 'contain' | 'cover' | 'scale';
};
export declare function BackgroundImage({ source, materialSource, resizeMode }: BackgroundImageProps): null;
