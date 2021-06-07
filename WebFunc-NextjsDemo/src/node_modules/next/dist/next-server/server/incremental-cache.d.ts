/// <reference types="lru-cache" />
import LRUCache from 'next/dist/compiled/lru-cache';
import { PrerenderManifest } from '../../build';
declare type IncrementalCacheValue = {
    html: string;
    pageData: any;
    isStale?: boolean;
    curRevalidate?: number | false;
    revalidateAfter: number | false;
};
export declare class IncrementalCache {
    incrementalOptions: {
        flushToDisk?: boolean;
        pagesDir?: string;
        distDir?: string;
        dev?: boolean;
    };
    prerenderManifest: PrerenderManifest;
    cache: LRUCache<string, IncrementalCacheValue>;
    constructor({ max, dev, distDir, pagesDir, flushToDisk, }: {
        dev: boolean;
        max?: number;
        distDir: string;
        pagesDir: string;
        flushToDisk?: boolean;
    });
    private getSeedPath;
    private calculateRevalidate;
    getFallback(page: string): Promise<string>;
    get(pathname: string): Promise<IncrementalCacheValue | void>;
    set(pathname: string, data: {
        html: string;
        pageData: any;
    }, revalidateSeconds?: number | false): Promise<void>;
}
export {};
