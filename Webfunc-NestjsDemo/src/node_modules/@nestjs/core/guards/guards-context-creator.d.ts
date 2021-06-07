import { CanActivate } from '@nestjs/common';
import { Controller } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '../application-config';
import { ContextCreator } from '../helpers/context-creator';
import { NestContainer } from '../injector/container';
import { InstanceWrapper } from '../injector/instance-wrapper';
export declare class GuardsContextCreator extends ContextCreator {
    private readonly container;
    private readonly config?;
    private moduleContext;
    constructor(container: NestContainer, config?: ApplicationConfig);
    create(instance: Controller, callback: (...args: unknown[]) => unknown, module: string, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): CanActivate[];
    createConcreteContext<T extends unknown[], R extends unknown[]>(metadata: T, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): R;
    getGuardInstance(guard: Function | CanActivate, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): CanActivate | null;
    getInstanceByMetatype<T extends Record<string, any> | Function>(guard: T): InstanceWrapper | undefined;
    getGlobalMetadata<T extends unknown[]>(contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): T;
}
