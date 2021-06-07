/// <reference types="node" />
import { TransformOptions } from './types';
export declare type JITIOptions = {
    transform?: (opts: TransformOptions) => string;
    debug?: boolean;
    cache?: boolean | string;
    dynamicImport?: (id: string) => Promise<any>;
    onError?: (error: Error) => void;
};
export default function createJITI(_filename?: string, opts?: JITIOptions): typeof require;
