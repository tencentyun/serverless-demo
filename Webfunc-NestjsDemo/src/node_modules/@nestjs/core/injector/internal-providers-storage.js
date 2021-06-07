"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalProvidersStorage = void 0;
const helpers_1 = require("../helpers");
class InternalProvidersStorage {
    constructor() {
        this._httpAdapterHost = new helpers_1.HttpAdapterHost();
    }
    get httpAdapterHost() {
        return this._httpAdapterHost;
    }
    get httpAdapter() {
        return this._httpAdapter;
    }
    set httpAdapter(httpAdapter) {
        this._httpAdapter = httpAdapter;
    }
}
exports.InternalProvidersStorage = InternalProvidersStorage;
