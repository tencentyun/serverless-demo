"use strict";
var InternalCoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalCoreModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const request_providers_1 = require("../router/request/request-providers");
const services_1 = require("../services");
const inquirer_providers_1 = require("./inquirer/inquirer-providers");
let InternalCoreModule = InternalCoreModule_1 = class InternalCoreModule {
    static register(providers) {
        return {
            module: InternalCoreModule_1,
            providers: [...providers],
            exports: [...providers.map(item => item.provide)],
        };
    }
};
InternalCoreModule = InternalCoreModule_1 = tslib_1.__decorate([
    common_1.Global(),
    common_1.Module({
        providers: [services_1.Reflector, request_providers_1.requestProvider, inquirer_providers_1.inquirerProvider],
        exports: [services_1.Reflector, request_providers_1.requestProvider, inquirer_providers_1.inquirerProvider],
    })
], InternalCoreModule);
exports.InternalCoreModule = InternalCoreModule;
