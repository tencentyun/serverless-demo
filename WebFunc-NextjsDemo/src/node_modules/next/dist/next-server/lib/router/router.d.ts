/// <reference types="node" />
import { ParsedUrlQuery } from 'querystring';
import { ComponentType } from 'react';
import { UrlObject } from 'url';
import { GoodPageCache, StyleSheetTuple } from '../../../client/page-loader';
import { MittEmitter } from '../mitt';
import { NextPageContext } from '../utils';
interface TransitionOptions {
    shallow?: boolean;
}
interface NextHistoryState {
    url: string;
    as: string;
    options: TransitionOptions;
}
export declare function addLocale(path: string, locale?: string, defaultLocale?: string): string;
export declare function delLocale(path: string, locale?: string): string;
export declare function hasBasePath(path: string): boolean;
export declare function addBasePath(path: string): string;
export declare function delBasePath(path: string): string;
/**
 * Detects whether a given url is routable by the Next.js router (browser only).
 */
export declare function isLocalURL(url: string): boolean;
declare type Url = UrlObject | string;
export declare function interpolateAs(route: string, asPathname: string, query: ParsedUrlQuery): {
    params: string[];
    result: string;
};
/**
 * Resolves a given hyperlink with a certain router state (basePath not included).
 * Preserves absolute urls.
 */
export declare function resolveHref(currentPath: string, href: Url, resolveAs?: boolean): string;
export declare function markLoadingError(err: Error): Error;
export declare type BaseRouter = {
    route: string;
    pathname: string;
    query: ParsedUrlQuery;
    asPath: string;
    basePath: string;
    locale?: string;
    locales?: string[];
    defaultLocale?: string;
};
export declare type NextRouter = BaseRouter & Pick<Router, 'push' | 'replace' | 'reload' | 'back' | 'prefetch' | 'beforePopState' | 'events' | 'isFallback'>;
export declare type PrefetchOptions = {
    priority?: boolean;
};
export declare type PrivateRouteInfo = {
    Component: ComponentType;
    styleSheets: StyleSheetTuple[];
    __N_SSG?: boolean;
    __N_SSP?: boolean;
    props?: Record<string, any>;
    err?: Error;
    error?: any;
};
export declare type AppProps = Pick<PrivateRouteInfo, 'Component' | 'err'> & {
    router: Router;
} & Record<string, any>;
export declare type AppComponent = ComponentType<AppProps>;
declare type Subscription = (data: PrivateRouteInfo, App: AppComponent) => Promise<void>;
declare type BeforePopStateCallback = (state: NextHistoryState) => boolean;
declare type ComponentLoadCancel = (() => void) | null;
declare type HistoryMethod = 'replaceState' | 'pushState';
export default class Router implements BaseRouter {
    route: string;
    pathname: string;
    query: ParsedUrlQuery;
    asPath: string;
    basePath: string;
    /**
     * Map of all components loaded in `Router`
     */
    components: {
        [pathname: string]: PrivateRouteInfo;
    };
    sdc: {
        [asPath: string]: object;
    };
    sub: Subscription;
    clc: ComponentLoadCancel;
    pageLoader: any;
    _bps: BeforePopStateCallback | undefined;
    events: MittEmitter;
    _wrapApp: (App: AppComponent) => any;
    isSsr: boolean;
    isFallback: boolean;
    _inFlightRoute?: string;
    _shallow?: boolean;
    locale?: string;
    locales?: string[];
    defaultLocale?: string;
    static events: MittEmitter;
    constructor(pathname: string, query: ParsedUrlQuery, as: string, { initialProps, pageLoader, App, wrapApp, Component, initialStyleSheets, err, subscription, isFallback, locale, locales, defaultLocale, }: {
        subscription: Subscription;
        initialProps: any;
        pageLoader: any;
        Component: ComponentType;
        initialStyleSheets: StyleSheetTuple[];
        App: AppComponent;
        wrapApp: (App: AppComponent) => any;
        err?: Error;
        isFallback: boolean;
        locale?: string;
        locales?: string[];
        defaultLocale?: string;
    });
    onPopState: (e: PopStateEvent) => void;
    reload(): void;
    /**
     * Go back in history
     */
    back(): void;
    /**
     * Performs a `pushState` with arguments
     * @param url of the route
     * @param as masks `url` for the browser
     * @param options object you can define `shallow` and other options
     */
    push(url: Url, as?: Url, options?: TransitionOptions): Promise<boolean>;
    /**
     * Performs a `replaceState` with arguments
     * @param url of the route
     * @param as masks `url` for the browser
     * @param options object you can define `shallow` and other options
     */
    replace(url: Url, as?: Url, options?: TransitionOptions): Promise<boolean>;
    change(method: HistoryMethod, url: string, as: string, options: TransitionOptions): Promise<boolean>;
    changeState(method: HistoryMethod, url: string, as: string, options?: TransitionOptions): void;
    handleRouteInfoError(err: Error & {
        code: any;
        cancelled: boolean;
    }, pathname: string, query: ParsedUrlQuery, as: string, loadErrorFail?: boolean): Promise<PrivateRouteInfo>;
    getRouteInfo(route: string, pathname: string, query: any, as: string, shallow?: boolean): Promise<PrivateRouteInfo>;
    set(route: string, pathname: string, query: ParsedUrlQuery, as: string, data: PrivateRouteInfo): Promise<void>;
    /**
     * Callback to execute before replacing router state
     * @param cb callback to be executed
     */
    beforePopState(cb: BeforePopStateCallback): void;
    onlyAHashChange(as: string): boolean;
    scrollToHash(as: string): void;
    urlIsNew(asPath: string): boolean;
    _resolveHref(parsedHref: UrlObject, pages: string[], applyBasePath?: boolean): UrlObject;
    /**
     * Prefetch page code, you may wait for the data during page rendering.
     * This feature only works in production!
     * @param url the href of prefetched page
     * @param asPath the as path of the prefetched page
     */
    prefetch(url: string, asPath?: string, options?: PrefetchOptions): Promise<void>;
    fetchComponent(route: string): Promise<GoodPageCache>;
    _getData<T>(fn: () => Promise<T>): Promise<T>;
    _getStaticData(dataHref: string): Promise<object>;
    _getServerData(dataHref: string): Promise<object>;
    getInitialProps(Component: ComponentType, ctx: NextPageContext): Promise<any>;
    abortComponentLoad(as: string): void;
    notify(data: PrivateRouteInfo): Promise<void>;
}
export {};
