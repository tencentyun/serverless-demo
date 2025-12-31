"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlerFactory = createHandlerFactory;
const connect_error_js_1 = require("../connect-error.js");
const code_js_1 = require("../code.js");
const implementation_js_1 = require("../implementation.js");
const trailer_js_1 = require("./trailer.js");
const headers_js_1 = require("./headers.js");
const content_type_js_1 = require("./content-type.js");
const parse_timeout_js_1 = require("../protocol-grpc/parse-timeout.js");
const trailer_status_js_1 = require("../protocol-grpc/trailer-status.js");
const async_iterable_js_1 = require("../protocol/async-iterable.js");
const compression_js_1 = require("../protocol/compression.js");
const content_type_matcher_js_1 = require("../protocol/content-type-matcher.js");
const create_method_url_js_1 = require("../protocol/create-method-url.js");
const invoke_implementation_js_1 = require("../protocol/invoke-implementation.js");
const serialization_js_1 = require("../protocol/serialization.js");
const universal_handler_js_1 = require("../protocol/universal-handler.js");
const universal_js_1 = require("../protocol/universal.js");
const protocolName = "grpc-web";
const methodPost = "POST";
/**
 * Create a factory that creates gRPC-web handlers.
 */
function createHandlerFactory(options) {
    const opt = (0, universal_handler_js_1.validateUniversalHandlerOptions)(options);
    const trailerSerialization = (0, trailer_js_1.createTrailerSerialization)();
    function fact(spec) {
        const h = createHandler(opt, trailerSerialization, spec);
        return Object.assign(h, {
            protocolNames: [protocolName],
            allowedMethods: [methodPost],
            supportedContentType: (0, content_type_matcher_js_1.contentTypeMatcher)(content_type_js_1.contentTypeRegExp),
            requestPath: (0, create_method_url_js_1.createMethodUrl)("/", spec.method),
            service: spec.method.parent,
            method: spec.method,
        });
    }
    fact.protocolName = protocolName;
    return fact;
}
function createHandler(opt, trailerSerialization, spec) {
    const serialization = (0, serialization_js_1.createMethodSerializationLookup)(spec.method, opt.binaryOptions, opt.jsonOptions, opt);
    return async function handle(req) {
        (0, universal_js_1.assertByteStreamRequest)(req);
        const type = (0, content_type_js_1.parseContentType)(req.header.get(headers_js_1.headerContentType));
        if (type == undefined || type.text) {
            return universal_js_1.uResponseUnsupportedMediaType;
        }
        if (req.method !== methodPost) {
            return universal_js_1.uResponseMethodNotAllowed;
        }
        const timeout = (0, parse_timeout_js_1.parseTimeout)(req.header.get(headers_js_1.headerTimeout), opt.maxTimeoutMs);
        const context = (0, implementation_js_1.createHandlerContext)(Object.assign(Object.assign({}, spec), { service: spec.method.parent, requestMethod: req.method, protocolName, timeoutMs: timeout.timeoutMs, shutdownSignal: opt.shutdownSignal, requestSignal: req.signal, requestHeader: req.header, url: req.url, responseHeader: {
                [headers_js_1.headerContentType]: type.binary ? content_type_js_1.contentTypeProto : content_type_js_1.contentTypeJson,
            }, responseTrailer: {
                [headers_js_1.headerGrpcStatus]: trailer_status_js_1.grpcStatusOk,
            }, contextValues: req.contextValues }));
        const compression = (0, compression_js_1.compressionNegotiate)(opt.acceptCompression, req.header.get(headers_js_1.headerEncoding), req.header.get(headers_js_1.headerAcceptEncoding), headers_js_1.headerAcceptEncoding);
        if (compression.response) {
            context.responseHeader.set(headers_js_1.headerEncoding, compression.response.name);
        }
        // We split the pipeline into two parts: The request iterator, and the
        // response iterator. We do this because the request iterator is responsible
        // for parsing the request body, and we don't want write errors of the response
        // iterator to affect the request iterator.
        const inputIt = (0, async_iterable_js_1.pipe)(req.body, (0, async_iterable_js_1.transformPrepend)(() => {
            // raise compression error to serialize it as a trailer status
            if (compression.error)
                throw compression.error;
            // raise timeout parsing error to serialize it as a trailer status
            if (timeout.error)
                throw timeout.error;
            return undefined;
        }), (0, async_iterable_js_1.transformSplitEnvelope)(opt.readMaxBytes), (0, async_iterable_js_1.transformDecompressEnvelope)(compression.request, opt.readMaxBytes), (0, async_iterable_js_1.transformParseEnvelope)(serialization.getI(type.binary), trailer_js_1.trailerFlag));
        const it = (0, invoke_implementation_js_1.transformInvokeImplementation)(spec, context, opt.interceptors)(inputIt)[Symbol.asyncIterator]();
        const outputIt = (0, async_iterable_js_1.pipe)(
        // We wrap the iterator in an async iterator to ensure that the
        // abort signal is aborted when the iterator is done.
        {
            [Symbol.asyncIterator]() {
                return {
                    next: () => it.next(),
                    throw: (e) => {
                        var _a, _b;
                        context.abort(e);
                        return (_b = (_a = it.throw) === null || _a === void 0 ? void 0 : _a.call(it, e)) !== null && _b !== void 0 ? _b : Promise.reject({ done: true });
                    },
                    return: (v) => {
                        var _a, _b;
                        context.abort();
                        return ((_b = (_a = it.return) === null || _a === void 0 ? void 0 : _a.call(it, v)) !== null && _b !== void 0 ? _b : Promise.resolve({ done: true, value: v }));
                    },
                };
            },
        }, (0, async_iterable_js_1.transformSerializeEnvelope)(serialization.getO(type.binary)), (0, async_iterable_js_1.transformCatchFinally)((e) => {
            context.abort(e);
            if (e instanceof connect_error_js_1.ConnectError) {
                (0, trailer_status_js_1.setTrailerStatus)(context.responseTrailer, e);
            }
            else if (e !== undefined) {
                (0, trailer_status_js_1.setTrailerStatus)(context.responseTrailer, new connect_error_js_1.ConnectError("internal error", code_js_1.Code.Internal, undefined, undefined, e));
            }
            return {
                flags: trailer_js_1.trailerFlag,
                data: trailerSerialization.serialize(context.responseTrailer),
            };
        }), (0, async_iterable_js_1.transformCompressEnvelope)(compression.response, opt.compressMinBytes), (0, async_iterable_js_1.transformJoinEnvelopes)(), { propagateDownStreamError: true });
        return Object.assign(Object.assign({}, universal_js_1.uResponseOk), { 
            // We wait for the first response body bytes before resolving, so that
            // implementations have a chance to add headers before an adapter commits
            // them to the wire.
            body: await (0, async_iterable_js_1.untilFirst)(outputIt), header: context.responseHeader });
    };
}
