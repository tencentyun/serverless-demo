"use strict";
var MulterModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulterModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const files_constants_1 = require("./files.constants");
const multer_constants_1 = require("./multer.constants");
let MulterModule = MulterModule_1 = class MulterModule {
    static register(options = {}) {
        return {
            module: MulterModule_1,
            providers: [
                { provide: files_constants_1.MULTER_MODULE_OPTIONS, useValue: options },
                {
                    provide: multer_constants_1.MULTER_MODULE_ID,
                    useValue: random_string_generator_util_1.randomStringGenerator(),
                },
            ],
            exports: [files_constants_1.MULTER_MODULE_OPTIONS],
        };
    }
    static registerAsync(options) {
        return {
            module: MulterModule_1,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                {
                    provide: multer_constants_1.MULTER_MODULE_ID,
                    useValue: random_string_generator_util_1.randomStringGenerator(),
                },
            ],
            exports: [files_constants_1.MULTER_MODULE_OPTIONS],
        };
    }
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: files_constants_1.MULTER_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: files_constants_1.MULTER_MODULE_OPTIONS,
            useFactory: async (optionsFactory) => optionsFactory.createMulterOptions(),
            inject: [options.useExisting || options.useClass],
        };
    }
};
MulterModule = MulterModule_1 = tslib_1.__decorate([
    common_1.Module({})
], MulterModule);
exports.MulterModule = MulterModule;
