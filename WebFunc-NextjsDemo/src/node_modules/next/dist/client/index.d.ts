import '@next/polyfill-module';
import React from 'react';
import type Router from '../next-server/lib/router/router';
import type { AppComponent, AppProps, PrivateRouteInfo } from '../next-server/lib/router/router';
import type { NEXT_DATA } from '../next-server/lib/utils';
import { StyleSheetTuple } from './page-loader';
declare global {
    interface Window {
        __NEXT_HYDRATED?: boolean;
        __NEXT_HYDRATED_CB?: () => void;
        __NEXT_PRELOADREADY?: (ids?: string[]) => void;
        __NEXT_DATA__: NEXT_DATA;
        __NEXT_P: any[];
    }
}
declare type RenderRouteInfo = PrivateRouteInfo & {
    App: AppComponent;
};
declare type RenderErrorProps = Omit<RenderRouteInfo, 'Component' | 'styleSheets'>;
export declare const version: string | undefined;
export declare let router: Router;
export declare const emitter: import("../next-server/lib/mitt").MittEmitter;
declare const _default: (opts?: {
    webpackHMR?: any;
}) => Promise<import("../next-server/lib/mitt").MittEmitter | {
    emitter: import("../next-server/lib/mitt").MittEmitter;
    render: typeof render;
    renderCtx: {
        App: React.ComponentType<AppProps>;
        Component: React.ComponentType<{}>;
        styleSheets: StyleSheetTuple[];
        props: Record<string, any>;
        err: (Error & {
            statusCode?: number | undefined;
        }) | undefined;
    };
}>;
export default _default;
export declare function render(renderingProps: RenderRouteInfo): Promise<void>;
export declare function renderError(renderErrorProps: RenderErrorProps): Promise<any>;
