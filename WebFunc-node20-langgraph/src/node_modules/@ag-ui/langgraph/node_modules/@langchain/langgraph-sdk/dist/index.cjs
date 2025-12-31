"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideFetchImplementation = exports.getApiKey = exports.Client = void 0;
var client_js_1 = require("./client.cjs");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_js_1.Client; } });
Object.defineProperty(exports, "getApiKey", { enumerable: true, get: function () { return client_js_1.getApiKey; } });
var fetch_js_1 = require("./singletons/fetch.cjs");
Object.defineProperty(exports, "overrideFetchImplementation", { enumerable: true, get: function () { return fetch_js_1.overrideFetchImplementation; } });
