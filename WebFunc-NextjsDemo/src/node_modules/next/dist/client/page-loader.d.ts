import { ComponentType } from 'react';
export declare const looseToArray: <T extends {}>(input: any) => T[];
export declare type StyleSheetTuple = {
    href: string;
    text: string;
};
export declare type GoodPageCache = {
    page: ComponentType;
    mod: any;
    styleSheets: StyleSheetTuple[];
};
export declare type PageCacheEntry = {
    error: any;
} | GoodPageCache;
export default class PageLoader {
    private initialPage;
    private buildId;
    private assetPrefix;
    private pageCache;
    private pageRegisterEvents;
    private loadingRoutes;
    private promisedBuildManifest?;
    private promisedSsgManifest?;
    private promisedDevPagesManifest?;
    constructor(buildId: string, assetPrefix: string, initialPage: string);
    getPageList(): any;
    private getDependencies;
    /**
     * @param {string} href the route href (file-system path)
     * @param {string} asPath the URL as shown in browser (virtual path); used for dynamic routes
     */
    getDataHref(href: string, asPath: string, ssg: boolean, locale?: string, defaultLocale?: string): string;
    /**
     * @param {string} href the route href (file-system path)
     * @param {string} asPath the URL as shown in browser (virtual path); used for dynamic routes
     */
    prefetchData(href: string, asPath: string, locale?: string, defaultLocale?: string): Promise<any>;
    loadPage(route: string): Promise<GoodPageCache>;
    registerPage(route: string, regFn: () => any): void;
    /**
     * @param {string} route
     * @param {boolean} [isDependency]
     */
    prefetch(route: string, isDependency?: boolean): Promise<void>;
}
