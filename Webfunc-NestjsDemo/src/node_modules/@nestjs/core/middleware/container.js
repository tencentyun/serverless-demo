"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareContainer = void 0;
const constants_1 = require("@nestjs/common/constants");
const instance_wrapper_1 = require("../injector/instance-wrapper");
class MiddlewareContainer {
    constructor(container) {
        this.container = container;
        this.middleware = new Map();
        this.configurationSets = new Map();
    }
    getMiddlewareCollection(moduleKey) {
        if (!this.middleware.has(moduleKey)) {
            const moduleRef = this.container.getModuleByKey(moduleKey);
            this.middleware.set(moduleKey, moduleRef.middlewares);
        }
        return this.middleware.get(moduleKey);
    }
    getConfigurations() {
        return this.configurationSets;
    }
    insertConfig(configList, moduleKey) {
        const middleware = this.getMiddlewareCollection(moduleKey);
        const targetConfig = this.getTargetConfig(moduleKey);
        const configurations = configList || [];
        const insertMiddleware = (metatype) => {
            const token = metatype.name;
            middleware.set(token, new instance_wrapper_1.InstanceWrapper({
                scope: this.getClassScope(metatype),
                metatype,
                name: token,
            }));
        };
        configurations.forEach(config => {
            [].concat(config.middleware).map(insertMiddleware);
            targetConfig.add(config);
        });
    }
    getTargetConfig(moduleName) {
        if (!this.configurationSets.has(moduleName)) {
            this.configurationSets.set(moduleName, new Set());
        }
        return this.configurationSets.get(moduleName);
    }
    getClassScope(type) {
        const metadata = Reflect.getMetadata(constants_1.SCOPE_OPTIONS_METADATA, type);
        return metadata && metadata.scope;
    }
}
exports.MiddlewareContainer = MiddlewareContainer;
