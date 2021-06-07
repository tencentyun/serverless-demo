import { HttpServer } from '@nestjs/common/interfaces';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { ApplicationConfig } from '../application-config';
import { NestContainer } from '../injector/container';
import { Injector } from '../injector/injector';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { Resolver } from './interfaces/resolver.interface';
export declare class RoutesResolver implements Resolver {
    private readonly container;
    private readonly config;
    private readonly injector;
    private readonly logger;
    private readonly routerProxy;
    private readonly routerExceptionsFilter;
    private readonly routerExplorer;
    constructor(container: NestContainer, config: ApplicationConfig, injector: Injector);
    resolve<T extends HttpServer>(applicationRef: T, basePath: string): void;
    registerRouters(routes: Map<string, InstanceWrapper<Controller>>, moduleName: string, basePath: string, applicationRef: HttpServer): void;
    registerNotFoundHandler(): void;
    registerExceptionHandler(): void;
    mapExternalException(err: any): any;
    private getModulePathMetadata;
    private getHostMetadata;
}
