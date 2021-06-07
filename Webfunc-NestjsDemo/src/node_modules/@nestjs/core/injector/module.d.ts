import { Abstract, ClassProvider, Controller, DynamicModule, ExistingProvider, FactoryProvider, Injectable, NestModule, Provider, ValueProvider } from '@nestjs/common/interfaces';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { NestContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
import { ModuleRef } from './module-ref';
interface ProviderName {
    name?: string | symbol;
}
export declare class Module {
    private readonly _metatype;
    private readonly container;
    private readonly _id;
    private readonly _imports;
    private readonly _providers;
    private readonly _injectables;
    private readonly _middlewares;
    private readonly _controllers;
    private readonly _exports;
    private _distance;
    constructor(_metatype: Type<any>, container: NestContainer);
    get id(): string;
    get providers(): Map<any, InstanceWrapper<Injectable>>;
    get middlewares(): Map<any, InstanceWrapper<Injectable>>;
    get imports(): Set<Module>;
    /**
     * Left for backward-compatibility reasons
     */
    get relatedModules(): Set<Module>;
    /**
     * Left for backward-compatibility reasons
     */
    get components(): Map<string, InstanceWrapper<Injectable>>;
    /**
     * Left for backward-compatibility reasons
     */
    get routes(): Map<string, InstanceWrapper<Controller>>;
    get injectables(): Map<string, InstanceWrapper<Injectable>>;
    get controllers(): Map<string, InstanceWrapper<Controller>>;
    get exports(): Set<string | symbol>;
    get instance(): NestModule;
    get metatype(): Type<any>;
    get distance(): number;
    set distance(value: number);
    addCoreProviders(): void;
    addModuleRef(): void;
    addModuleAsProvider(): void;
    addApplicationConfig(): void;
    addInjectable<T extends Injectable>(injectable: Provider, host?: Type<T>): string;
    addProvider(provider: Provider): string;
    isCustomProvider(provider: Provider): provider is ClassProvider | FactoryProvider | ValueProvider | ExistingProvider;
    addCustomProvider(provider: (ClassProvider | FactoryProvider | ValueProvider | ExistingProvider) & ProviderName, collection: Map<string, any>): string;
    isCustomClass(provider: any): provider is ClassProvider;
    isCustomValue(provider: any): provider is ValueProvider;
    isCustomFactory(provider: any): provider is FactoryProvider;
    isCustomUseExisting(provider: any): provider is ExistingProvider;
    isDynamicModule(exported: any): exported is DynamicModule;
    addCustomClass(provider: ClassProvider & ProviderName, collection: Map<string, InstanceWrapper>): void;
    addCustomValue(provider: ValueProvider & ProviderName, collection: Map<string, InstanceWrapper>): void;
    addCustomFactory(provider: FactoryProvider & ProviderName, collection: Map<string, InstanceWrapper>): void;
    addCustomUseExisting(provider: ExistingProvider & ProviderName, collection: Map<string, InstanceWrapper>): void;
    addExportedProvider(provider: (Provider & ProviderName) | string | symbol | DynamicModule): Set<string | symbol>;
    addCustomExportedProvider(provider: FactoryProvider | ValueProvider | ClassProvider | ExistingProvider): Set<string | symbol>;
    validateExportedProvider(token: string | symbol): string | symbol;
    addController(controller: Type<Controller>): void;
    assignControllerUniqueId(controller: Type<Controller>): void;
    addRelatedModule(module: Module): void;
    replace(toReplace: string | symbol | Type<any>, options: any): void;
    hasProvider(token: string | symbol | Type<any>): boolean;
    hasInjectable(token: string | symbol | Type<any>): boolean;
    getProviderStaticToken(provider: string | symbol | Type<any> | Abstract<any>): string | symbol;
    getProviderByKey<T = any>(name: string | symbol): InstanceWrapper<T>;
    getNonAliasProviders(): Array<[string, InstanceWrapper<Injectable>]>;
    createModuleReferenceType(): Type<ModuleRef>;
}
export {};
