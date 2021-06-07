"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceLoader = void 0;
const common_1 = require("@nestjs/common");
const messages_1 = require("../helpers/messages");
const injector_1 = require("./injector");
const internal_core_module_1 = require("./internal-core-module");
class InstanceLoader {
    constructor(container) {
        this.container = container;
        this.injector = new injector_1.Injector();
        this.logger = new common_1.Logger(InstanceLoader.name, true);
    }
    async createInstancesOfDependencies() {
        const modules = this.container.getModules();
        this.createPrototypes(modules);
        await this.createInstances(modules);
    }
    createPrototypes(modules) {
        modules.forEach(module => {
            this.createPrototypesOfProviders(module);
            this.createPrototypesOfInjectables(module);
            this.createPrototypesOfControllers(module);
        });
    }
    async createInstances(modules) {
        await Promise.all([...modules.values()].map(async (module) => {
            await this.createInstancesOfProviders(module);
            await this.createInstancesOfInjectables(module);
            await this.createInstancesOfControllers(module);
            const { name } = module.metatype;
            this.isModuleWhitelisted(name) &&
                this.logger.log(messages_1.MODULE_INIT_MESSAGE `${name}`);
        }));
    }
    createPrototypesOfProviders(module) {
        const { providers } = module;
        providers.forEach(wrapper => this.injector.loadPrototype(wrapper, providers));
    }
    async createInstancesOfProviders(module) {
        const { providers } = module;
        const wrappers = [...providers.values()];
        await Promise.all(wrappers.map(item => this.injector.loadProvider(item, module)));
    }
    createPrototypesOfControllers(module) {
        const { controllers } = module;
        controllers.forEach(wrapper => this.injector.loadPrototype(wrapper, controllers));
    }
    async createInstancesOfControllers(module) {
        const { controllers } = module;
        const wrappers = [...controllers.values()];
        await Promise.all(wrappers.map(item => this.injector.loadController(item, module)));
    }
    createPrototypesOfInjectables(module) {
        const { injectables } = module;
        injectables.forEach(wrapper => this.injector.loadPrototype(wrapper, injectables));
    }
    async createInstancesOfInjectables(module) {
        const { injectables } = module;
        const wrappers = [...injectables.values()];
        await Promise.all(wrappers.map(item => this.injector.loadInjectable(item, module)));
    }
    isModuleWhitelisted(name) {
        return name !== internal_core_module_1.InternalCoreModule.name;
    }
}
exports.InstanceLoader = InstanceLoader;
