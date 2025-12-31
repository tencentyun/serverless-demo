// Copyright 2021-2024 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { uResponseMethodNotAllowed, uResponseUnsupportedMediaType, uResponseVersionNotSupported, } from "./universal.js";
import { contentTypeMatcher } from "./content-type-matcher.js";
import { validateReadWriteMaxBytes } from "./limit-io.js";
import { ConnectError } from "../connect-error.js";
import { Code } from "../code.js";
/**
 * Asserts that the options are within sane limits, and returns default values
 * where no value is provided.
 *
 * Note that this function does not set default values for `acceptCompression`.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function validateUniversalHandlerOptions(opt) {
    var _a, _b, _c;
    opt !== null && opt !== void 0 ? opt : (opt = {});
    const acceptCompression = opt.acceptCompression
        ? [...opt.acceptCompression]
        : [];
    const requireConnectProtocolHeader = (_a = opt.requireConnectProtocolHeader) !== null && _a !== void 0 ? _a : false;
    const maxTimeoutMs = (_b = opt.maxTimeoutMs) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER;
    return Object.assign(Object.assign({ acceptCompression }, validateReadWriteMaxBytes(opt.readMaxBytes, opt.writeMaxBytes, opt.compressMinBytes)), { jsonOptions: opt.jsonOptions, binaryOptions: opt.binaryOptions, maxTimeoutMs, shutdownSignal: opt.shutdownSignal, requireConnectProtocolHeader, interceptors: (_c = opt.interceptors) !== null && _c !== void 0 ? _c : [] });
}
/**
 * For the given service implementation, return a universal handler for each
 * RPC. The handler serves the given protocols.
 *
 * At least one protocol is required.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function createUniversalServiceHandlers(spec, protocols) {
    return Object.entries(spec.methods).map(([, implSpec]) => createUniversalMethodHandler(implSpec, protocols));
}
/**
 * Return a universal handler for the given RPC implementation.
 * The handler serves the given protocols.
 *
 * At least one protocol is required.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function createUniversalMethodHandler(spec, protocols) {
    return negotiateProtocol(protocols.map((f) => f(spec)));
}
/**
 * Create a universal handler that negotiates the protocol.
 *
 * This functions takes one or more handlers - all for the same RPC, but for
 * different protocols - and returns a single handler that looks at the
 * Content-Type header and the HTTP verb of the incoming request to select
 * the appropriate protocol-specific handler.
 *
 * Raises an error if no protocol handlers were provided, or if they do not
 * handle exactly the same RPC.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function negotiateProtocol(protocolHandlers) {
    if (protocolHandlers.length == 0) {
        throw new ConnectError("at least one protocol is required", Code.Internal);
    }
    const service = protocolHandlers[0].service;
    const method = protocolHandlers[0].method;
    const requestPath = protocolHandlers[0].requestPath;
    if (protocolHandlers.some((h) => h.service !== service || h.method !== method)) {
        throw new ConnectError("cannot negotiate protocol for different RPCs", Code.Internal);
    }
    if (protocolHandlers.some((h) => h.requestPath !== requestPath)) {
        throw new ConnectError("cannot negotiate protocol for different requestPaths", Code.Internal);
    }
    async function protocolNegotiatingHandler(request) {
        var _a;
        if (method.methodKind == "bidi_streaming" &&
            request.httpVersion.startsWith("1.")) {
            return Object.assign(Object.assign({}, uResponseVersionNotSupported), { 
                // Clients coded to expect full-duplex connections may hang if they've
                // mistakenly negotiated HTTP/1.1. To unblock them, we must close the
                // underlying TCP connection.
                header: new Headers({ Connection: "close" }) });
        }
        const contentType = (_a = request.header.get("Content-Type")) !== null && _a !== void 0 ? _a : "";
        const matchingMethod = protocolHandlers.filter((h) => h.allowedMethods.includes(request.method));
        if (matchingMethod.length == 0) {
            return uResponseMethodNotAllowed;
        }
        // If Content-Type is unset but only one handler matches, use it.
        if (matchingMethod.length == 1 && contentType === "") {
            const onlyMatch = matchingMethod[0];
            return onlyMatch(request);
        }
        const matchingContentTypes = matchingMethod.filter((h) => h.supportedContentType(contentType));
        if (matchingContentTypes.length == 0) {
            return uResponseUnsupportedMediaType;
        }
        const firstMatch = matchingContentTypes[0];
        return firstMatch(request);
    }
    return Object.assign(protocolNegotiatingHandler, {
        service,
        method,
        requestPath,
        supportedContentType: contentTypeMatcher(...protocolHandlers.map((h) => h.supportedContentType)),
        protocolNames: protocolHandlers
            .flatMap((h) => h.protocolNames)
            .filter((value, index, array) => array.indexOf(value) === index),
        allowedMethods: protocolHandlers
            .flatMap((h) => h.allowedMethods)
            .filter((value, index, array) => array.indexOf(value) === index),
    });
}
