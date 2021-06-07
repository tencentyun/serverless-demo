import { __ApiPreviewProps } from '../next-server/server/api-utils';
import { LoadedEnvFiles } from '@next/env';
declare type PagesMapping = {
    [page: string]: string;
};
export declare function createPagesMapping(pagePaths: string[], extensions: string[]): PagesMapping;
export declare type WebpackEntrypoints = {
    [bundle: string]: string | string[];
};
declare type Entrypoints = {
    client: WebpackEntrypoints;
    server: WebpackEntrypoints;
};
export declare function createEntrypoints(pages: PagesMapping, target: 'server' | 'serverless' | 'experimental-serverless-trace', buildId: string, previewMode: __ApiPreviewProps, config: any, loadedEnvFiles: LoadedEnvFiles): Entrypoints;
export {};
