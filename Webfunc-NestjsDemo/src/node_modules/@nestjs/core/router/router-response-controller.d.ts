/// <reference types="node" />
import { HttpServer, RequestMethod } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { Observable } from 'rxjs';
import { HeaderStream } from './sse-stream';
export interface CustomHeader {
    name: string;
    value: string;
}
export interface RedirectResponse {
    url: string;
    statusCode?: number;
}
export declare class RouterResponseController {
    private readonly applicationRef;
    constructor(applicationRef: HttpServer);
    apply<TInput = any, TResponse = any>(result: TInput, response: TResponse, httpStatusCode?: number): Promise<any>;
    redirect<TInput = any, TResponse = any>(resultOrDeferred: TInput, response: TResponse, redirectResponse: RedirectResponse): Promise<void>;
    render<TInput = unknown, TResponse = unknown>(resultOrDeferred: TInput, response: TResponse, template: string): Promise<any>;
    transformToResult(resultOrDeferred: any): Promise<any>;
    getStatusByMethod(requestMethod: RequestMethod): number;
    setHeaders<TResponse = unknown>(response: TResponse, headers: CustomHeader[]): void;
    setStatus<TResponse = unknown>(response: TResponse, statusCode: number): void;
    sse<TInput extends Observable<unknown> = any, TResponse extends HeaderStream = any, TRequest extends IncomingMessage = any>(result: TInput, response: TResponse, request: TRequest): Promise<void>;
    private assertObservable;
}
