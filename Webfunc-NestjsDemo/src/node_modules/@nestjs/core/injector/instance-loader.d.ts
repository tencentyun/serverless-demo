import { NestContainer } from './container';
export declare class InstanceLoader {
    private readonly container;
    private readonly injector;
    private readonly logger;
    constructor(container: NestContainer);
    createInstancesOfDependencies(): Promise<void>;
    private createPrototypes;
    private createInstances;
    private createPrototypesOfProviders;
    private createInstancesOfProviders;
    private createPrototypesOfControllers;
    private createInstancesOfControllers;
    private createPrototypesOfInjectables;
    private createInstancesOfInjectables;
    private isModuleWhitelisted;
}
