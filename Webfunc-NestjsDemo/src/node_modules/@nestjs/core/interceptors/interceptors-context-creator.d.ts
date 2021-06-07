import { Controller, NestInterceptor } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '../application-config';
import { ContextCreator } from '../helpers/context-creator';
import { NestContainer } from '../injector/container';
import { InstanceWrapper } from '../injector/instance-wrapper';
export declare class InterceptorsContextCreator extends ContextCreator {
    private readonly container;
    private readonly config?;
    private moduleContext;
    constructor(container: NestContainer, config?: ApplicationConfig);
    create(instance: Controller, callback: (...args: unknown[]) => unknown, module: string, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): NestInterceptor[];
    createConcreteContext<T extends any[], R extends any[]>(metadata: T, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): R;
    getInterceptorInstance(interceptor: Function | NestInterceptor, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): NestInterceptor | null;
    getInstanceByMetatype<T extends Record<string, any> = any>(metatype: T): InstanceWrapper | undefined;
    getGlobalMetadata<T extends unknown[]>(contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): T;
}
