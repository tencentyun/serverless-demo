"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterceptorsContextCreator = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const context_creator_1 = require("../helpers/context-creator");
const constants_2 = require("../injector/constants");
class InterceptorsContextCreator extends context_creator_1.ContextCreator {
    constructor(container, config) {
        super();
        this.container = container;
        this.config = config;
    }
    create(instance, callback, module, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        this.moduleContext = module;
        return this.createContext(instance, callback, constants_1.INTERCEPTORS_METADATA, contextId, inquirerId);
    }
    createConcreteContext(metadata, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if (shared_utils_1.isEmpty(metadata)) {
            return [];
        }
        return iterare_1.iterate(metadata)
            .filter(interceptor => interceptor && (interceptor.name || interceptor.intercept))
            .map(interceptor => this.getInterceptorInstance(interceptor, contextId, inquirerId))
            .filter((interceptor) => interceptor && shared_utils_1.isFunction(interceptor.intercept))
            .toArray();
    }
    getInterceptorInstance(interceptor, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        const isObject = interceptor.intercept;
        if (isObject) {
            return interceptor;
        }
        const instanceWrapper = this.getInstanceByMetatype(interceptor);
        if (!instanceWrapper) {
            return null;
        }
        const instanceHost = instanceWrapper.getInstanceByContextId(contextId, inquirerId);
        return instanceHost && instanceHost.instance;
    }
    getInstanceByMetatype(metatype) {
        if (!this.moduleContext) {
            return;
        }
        const collection = this.container.getModules();
        const moduleRef = collection.get(this.moduleContext);
        if (!moduleRef) {
            return;
        }
        return moduleRef.injectables.get(metatype.name);
    }
    getGlobalMetadata(contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if (!this.config) {
            return [];
        }
        const globalInterceptors = this.config.getGlobalInterceptors();
        if (contextId === constants_2.STATIC_CONTEXT && !inquirerId) {
            return globalInterceptors;
        }
        const scopedInterceptorWrappers = this.config.getGlobalRequestInterceptors();
        const scopedInterceptors = iterare_1.iterate(scopedInterceptorWrappers)
            .map(wrapper => wrapper.getInstanceByContextId(contextId, inquirerId))
            .filter(host => !!host)
            .map(host => host.instance)
            .toArray();
        return globalInterceptors.concat(scopedInterceptors);
    }
}
exports.InterceptorsContextCreator = InterceptorsContextCreator;
