"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const application_config_1 = require("../application-config");
const invalid_class_exception_1 = require("../errors/exceptions/invalid-class.exception");
const runtime_exception_1 = require("../errors/exceptions/runtime.exception");
const unknown_export_exception_1 = require("../errors/exceptions/unknown-export.exception");
const helpers_1 = require("../helpers");
const get_class_scope_1 = require("../helpers/get-class-scope");
const constants_1 = require("./constants");
const instance_wrapper_1 = require("./instance-wrapper");
const module_ref_1 = require("./module-ref");
class Module {
    constructor(_metatype, container) {
        this._metatype = _metatype;
        this.container = container;
        this._imports = new Set();
        this._providers = new Map();
        this._injectables = new Map();
        this._middlewares = new Map();
        this._controllers = new Map();
        this._exports = new Set();
        this._distance = 0;
        this.addCoreProviders();
        this._id = random_string_generator_util_1.randomStringGenerator();
    }
    get id() {
        return this._id;
    }
    get providers() {
        return this._providers;
    }
    get middlewares() {
        return this._middlewares;
    }
    get imports() {
        return this._imports;
    }
    /**
     * Left for backward-compatibility reasons
     */
    get relatedModules() {
        return this._imports;
    }
    /**
     * Left for backward-compatibility reasons
     */
    get components() {
        return this._providers;
    }
    /**
     * Left for backward-compatibility reasons
     */
    get routes() {
        return this._controllers;
    }
    get injectables() {
        return this._injectables;
    }
    get controllers() {
        return this._controllers;
    }
    get exports() {
        return this._exports;
    }
    get instance() {
        if (!this._providers.has(this._metatype.name)) {
            throw new runtime_exception_1.RuntimeException();
        }
        const module = this._providers.get(this._metatype.name);
        return module.instance;
    }
    get metatype() {
        return this._metatype;
    }
    get distance() {
        return this._distance;
    }
    set distance(value) {
        this._distance = value;
    }
    addCoreProviders() {
        this.addModuleAsProvider();
        this.addModuleRef();
        this.addApplicationConfig();
    }
    addModuleRef() {
        const moduleRef = this.createModuleReferenceType();
        this._providers.set(module_ref_1.ModuleRef.name, new instance_wrapper_1.InstanceWrapper({
            name: module_ref_1.ModuleRef.name,
            metatype: module_ref_1.ModuleRef,
            isResolved: true,
            instance: new moduleRef(),
            host: this,
        }));
    }
    addModuleAsProvider() {
        this._providers.set(this._metatype.name, new instance_wrapper_1.InstanceWrapper({
            name: this._metatype.name,
            metatype: this._metatype,
            isResolved: false,
            instance: null,
            host: this,
        }));
    }
    addApplicationConfig() {
        this._providers.set(application_config_1.ApplicationConfig.name, new instance_wrapper_1.InstanceWrapper({
            name: application_config_1.ApplicationConfig.name,
            isResolved: true,
            instance: this.container.applicationConfig,
            host: this,
        }));
    }
    addInjectable(injectable, host) {
        if (this.isCustomProvider(injectable)) {
            return this.addCustomProvider(injectable, this._injectables);
        }
        let instanceWrapper = this.injectables.get(injectable.name);
        if (!instanceWrapper) {
            instanceWrapper = new instance_wrapper_1.InstanceWrapper({
                name: injectable.name,
                metatype: injectable,
                instance: null,
                isResolved: false,
                scope: get_class_scope_1.getClassScope(injectable),
                host: this,
            });
            this._injectables.set(injectable.name, instanceWrapper);
        }
        if (host) {
            const token = host && host.name;
            const hostWrapper = this._controllers.get(host && host.name) || this._providers.get(token);
            hostWrapper && hostWrapper.addEnhancerMetadata(instanceWrapper);
        }
    }
    addProvider(provider) {
        if (this.isCustomProvider(provider)) {
            return this.addCustomProvider(provider, this._providers);
        }
        this._providers.set(provider.name, new instance_wrapper_1.InstanceWrapper({
            name: provider.name,
            metatype: provider,
            instance: null,
            isResolved: false,
            scope: get_class_scope_1.getClassScope(provider),
            host: this,
        }));
        return provider.name;
    }
    isCustomProvider(provider) {
        return !shared_utils_1.isNil(provider.provide);
    }
    addCustomProvider(provider, collection) {
        const name = this.getProviderStaticToken(provider.provide);
        provider = Object.assign(Object.assign({}, provider), { name });
        if (this.isCustomClass(provider)) {
            this.addCustomClass(provider, collection);
        }
        else if (this.isCustomValue(provider)) {
            this.addCustomValue(provider, collection);
        }
        else if (this.isCustomFactory(provider)) {
            this.addCustomFactory(provider, collection);
        }
        else if (this.isCustomUseExisting(provider)) {
            this.addCustomUseExisting(provider, collection);
        }
        return name;
    }
    isCustomClass(provider) {
        return !shared_utils_1.isUndefined(provider.useClass);
    }
    isCustomValue(provider) {
        return !shared_utils_1.isUndefined(provider.useValue);
    }
    isCustomFactory(provider) {
        return !shared_utils_1.isUndefined(provider.useFactory);
    }
    isCustomUseExisting(provider) {
        return !shared_utils_1.isUndefined(provider.useExisting);
    }
    isDynamicModule(exported) {
        return exported && exported.module;
    }
    addCustomClass(provider, collection) {
        const { name, useClass } = provider;
        let { scope } = provider;
        if (shared_utils_1.isUndefined(scope)) {
            scope = get_class_scope_1.getClassScope(useClass);
        }
        collection.set(name, new instance_wrapper_1.InstanceWrapper({
            name,
            metatype: useClass,
            instance: null,
            isResolved: false,
            scope,
            host: this,
        }));
    }
    addCustomValue(provider, collection) {
        const { name, useValue: value } = provider;
        collection.set(name, new instance_wrapper_1.InstanceWrapper({
            name,
            metatype: null,
            instance: value,
            isResolved: true,
            async: value instanceof Promise,
            host: this,
        }));
    }
    addCustomFactory(provider, collection) {
        const { name, useFactory: factory, inject, scope } = provider;
        collection.set(name, new instance_wrapper_1.InstanceWrapper({
            name,
            metatype: factory,
            instance: null,
            isResolved: false,
            inject: inject || [],
            scope,
            host: this,
        }));
    }
    addCustomUseExisting(provider, collection) {
        const { name, useExisting } = provider;
        collection.set(name, new instance_wrapper_1.InstanceWrapper({
            name,
            metatype: (instance => instance),
            instance: null,
            isResolved: false,
            inject: [useExisting],
            host: this,
            isAlias: true,
        }));
    }
    addExportedProvider(provider) {
        const addExportedUnit = (token) => this._exports.add(this.validateExportedProvider(token));
        if (this.isCustomProvider(provider)) {
            return this.addCustomExportedProvider(provider);
        }
        else if (shared_utils_1.isString(provider) || shared_utils_1.isSymbol(provider)) {
            return addExportedUnit(provider);
        }
        else if (this.isDynamicModule(provider)) {
            const { module } = provider;
            return addExportedUnit(module.name);
        }
        addExportedUnit(provider.name);
    }
    addCustomExportedProvider(provider) {
        const provide = provider.provide;
        if (shared_utils_1.isString(provide) || shared_utils_1.isSymbol(provide)) {
            return this._exports.add(this.validateExportedProvider(provide));
        }
        this._exports.add(this.validateExportedProvider(provide.name));
    }
    validateExportedProvider(token) {
        if (this._providers.has(token)) {
            return token;
        }
        const importsArray = [...this._imports.values()];
        const importsNames = iterare_1.iterate(importsArray)
            .filter(item => !!item)
            .map(({ metatype }) => metatype)
            .filter(metatype => !!metatype)
            .map(({ name }) => name)
            .toArray();
        if (!importsNames.includes(token)) {
            const { name } = this.metatype;
            throw new unknown_export_exception_1.UnknownExportException(token, name);
        }
        return token;
    }
    addController(controller) {
        this._controllers.set(controller.name, new instance_wrapper_1.InstanceWrapper({
            name: controller.name,
            metatype: controller,
            instance: null,
            isResolved: false,
            scope: get_class_scope_1.getClassScope(controller),
            host: this,
        }));
        this.assignControllerUniqueId(controller);
    }
    assignControllerUniqueId(controller) {
        Object.defineProperty(controller, constants_1.CONTROLLER_ID_KEY, {
            enumerable: false,
            writable: false,
            configurable: true,
            value: random_string_generator_util_1.randomStringGenerator(),
        });
    }
    addRelatedModule(module) {
        this._imports.add(module);
    }
    replace(toReplace, options) {
        if (options.isProvider && this.hasProvider(toReplace)) {
            const name = this.getProviderStaticToken(toReplace);
            const originalProvider = this._providers.get(name);
            return originalProvider.mergeWith(Object.assign({ provide: toReplace }, options));
        }
        else if (!options.isProvider && this.hasInjectable(toReplace)) {
            const name = this.getProviderStaticToken(toReplace);
            const originalInjectable = this._injectables.get(name);
            return originalInjectable.mergeWith(Object.assign({ provide: toReplace }, options));
        }
    }
    hasProvider(token) {
        const name = this.getProviderStaticToken(token);
        return this._providers.has(name);
    }
    hasInjectable(token) {
        const name = this.getProviderStaticToken(token);
        return this._injectables.has(name);
    }
    getProviderStaticToken(provider) {
        return shared_utils_1.isFunction(provider)
            ? provider.name
            : provider;
    }
    getProviderByKey(name) {
        return this._providers.get(name);
    }
    getNonAliasProviders() {
        return [...this._providers].filter(([_, wrapper]) => !wrapper.isAlias);
    }
    createModuleReferenceType() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return class extends module_ref_1.ModuleRef {
            constructor() {
                super(self.container);
            }
            get(typeOrToken, options = { strict: true }) {
                return !(options && options.strict)
                    ? this.find(typeOrToken)
                    : this.find(typeOrToken, self);
            }
            resolve(typeOrToken, contextId = helpers_1.createContextId(), options = { strict: true }) {
                return this.resolvePerContext(typeOrToken, self, contextId, options);
            }
            async create(type) {
                if (!(type && shared_utils_1.isFunction(type) && type.prototype)) {
                    throw new invalid_class_exception_1.InvalidClassException(type);
                }
                return this.instantiateClass(type, self);
            }
        };
    }
}
exports.Module = Module;
