"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSerializerInterceptor = void 0;
const tslib_1 = require("tslib");
const operators_1 = require("rxjs/operators");
const core_1 = require("../decorators/core");
const load_package_util_1 = require("../utils/load-package.util");
const shared_utils_1 = require("../utils/shared.utils");
const class_serializer_constants_1 = require("./class-serializer.constants");
let classTransformer = {};
// NOTE (external)
// We need to deduplicate them here due to the circular dependency
// between core and common packages
const REFLECTOR = 'Reflector';
let ClassSerializerInterceptor = class ClassSerializerInterceptor {
    constructor(reflector, defaultOptions = {}) {
        this.reflector = reflector;
        this.defaultOptions = defaultOptions;
        classTransformer = load_package_util_1.loadPackage('class-transformer', 'ClassSerializerInterceptor', () => require('class-transformer'));
        require('class-transformer');
    }
    intercept(context, next) {
        const contextOptions = this.getContextOptions(context);
        const options = Object.assign(Object.assign({}, this.defaultOptions), contextOptions);
        return next
            .handle()
            .pipe(operators_1.map((res) => this.serialize(res, options)));
    }
    serialize(response, options) {
        const isArray = Array.isArray(response);
        if (!shared_utils_1.isObject(response) && !isArray) {
            return response;
        }
        return isArray
            ? response.map(item => this.transformToPlain(item, options))
            : this.transformToPlain(response, options);
    }
    transformToPlain(plainOrClass, options) {
        return plainOrClass && plainOrClass.constructor !== Object
            ? classTransformer.classToPlain(plainOrClass, options)
            : plainOrClass;
    }
    getContextOptions(context) {
        return (this.reflectSerializeMetadata(context.getHandler()) ||
            this.reflectSerializeMetadata(context.getClass()));
    }
    reflectSerializeMetadata(obj) {
        return this.reflector.get(class_serializer_constants_1.CLASS_SERIALIZER_OPTIONS, obj);
    }
};
ClassSerializerInterceptor = tslib_1.__decorate([
    core_1.Injectable(),
    tslib_1.__param(0, core_1.Inject(REFLECTOR)),
    tslib_1.__param(1, core_1.Optional()),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], ClassSerializerInterceptor);
exports.ClassSerializerInterceptor = ClassSerializerInterceptor;
