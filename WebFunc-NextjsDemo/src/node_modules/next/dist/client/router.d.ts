/// <reference types="node" />
import React from 'react';
import Router, { NextRouter } from '../next-server/lib/router/router';
declare type SingletonRouterBase = {
    router: Router | null;
    readyCallbacks: Array<() => any>;
    ready(cb: () => any): void;
};
export { Router, NextRouter };
export declare type SingletonRouter = SingletonRouterBase & NextRouter;
declare const _default: SingletonRouter;
export default _default;
export { default as withRouter } from './with-router';
export declare function useRouter(): NextRouter;
export declare const createRouter: (pathname: string, query: import("querystring").ParsedUrlQuery, as: string, __3: {
    subscription: (data: import("../next-server/lib/router/router").PrivateRouteInfo, App: React.ComponentType<import("../next-server/lib/router/router").AppProps>) => Promise<void>;
    initialProps: any;
    pageLoader: any;
    Component: React.ComponentType<{}>;
    initialStyleSheets: import("./page-loader").StyleSheetTuple[];
    App: React.ComponentType<import("../next-server/lib/router/router").AppProps>;
    wrapApp: (App: React.ComponentType<import("../next-server/lib/router/router").AppProps>) => any;
    err?: Error | undefined;
    isFallback: boolean;
    locale?: string | undefined;
    locales?: string[] | undefined;
    defaultLocale?: string | undefined;
}) => Router;
export declare function makePublicRouterInstance(router: Router): NextRouter;
