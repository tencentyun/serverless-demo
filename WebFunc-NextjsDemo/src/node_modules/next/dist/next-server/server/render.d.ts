/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { __ApiPreviewProps } from './api-utils';
import { FontManifest } from './font-utils';
import { LoadComponentsReturnType } from './load-components';
export declare type RenderOptsPartial = {
    buildId: string;
    canonicalBase: string;
    runtimeConfig?: {
        [key: string]: any;
    };
    assetPrefix?: string;
    err?: Error | null;
    autoExport?: boolean;
    nextExport?: boolean;
    dev?: boolean;
    ampMode?: any;
    ampPath?: string;
    inAmpMode?: boolean;
    hybridAmp?: boolean;
    ErrorDebug?: React.ComponentType<{
        error: Error;
    }>;
    ampValidator?: (html: string, pathname: string) => Promise<void>;
    ampSkipValidation?: boolean;
    ampOptimizerConfig?: {
        [key: string]: any;
    };
    isDataReq?: boolean;
    params?: ParsedUrlQuery;
    previewProps: __ApiPreviewProps;
    basePath: string;
    unstable_runtimeJS?: false;
    optimizeFonts: boolean;
    fontManifest?: FontManifest;
    optimizeImages: boolean;
    devOnlyCacheBusterQueryString?: string;
    resolvedUrl?: string;
    resolvedAsPath?: string;
    locale?: string;
    locales?: string[];
    defaultLocale?: string;
};
export declare type RenderOpts = LoadComponentsReturnType & RenderOptsPartial;
export declare function renderToHTML(req: IncomingMessage, res: ServerResponse, pathname: string, query: ParsedUrlQuery, renderOpts: RenderOpts): Promise<string | null>;
