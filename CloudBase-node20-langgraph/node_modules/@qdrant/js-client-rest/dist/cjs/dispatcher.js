"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDispatcher = void 0;
const undici_1 = require("undici");
const createDispatcher = (connections = 25) => new undici_1.Agent({
    // timeouts are handled by AbortSignal in our middleware
    bodyTimeout: 0,
    headersTimeout: 0,
    // https://stackoverflow.com/a/36437932/558180
    // pipelining: 1,
    // a sensible max connections value
    connections,
    // will be overriden by header Keep-Alive, just as sensible default
    keepAliveTimeout: 10000,
});
exports.createDispatcher = createDispatcher;
