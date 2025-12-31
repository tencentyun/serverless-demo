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
const protobuf_1 = require("@bufbuild/protobuf");
const wire_1 = require("@bufbuild/protobuf/wire");
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
const implementation_js_1 = require("../implementation.js");
const content_type_js_1 = require("./content-type.js");
const end_stream_js_1 = require("./end-stream.js");
const error_json_js_1 = require("./error-json.js");
const headers_js_1 = require("./headers.js");
const http_status_js_1 = require("./http-status.js");
const parse_timeout_js_1 = require("./parse-timeout.js");
const query_params_js_1 = require("./query-params.js");
const trailer_mux_js_1 = require("./trailer-mux.js");
const version_js_1 = require("./version.js");
const compression_js_1 = require("../protocol/compression.js");
const serialization_js_1 = require("../protocol/serialization.js");
const universal_handler_js_1 = require("../protocol/universal-handler.js");
const universal_js_1 = require("../protocol/universal.js");
const async_iterable_js_1 = require("../protocol/async-iterable.js");
const content_type_matcher_js_1 = require("../protocol/content-type-matcher.js");
const create_method_url_js_1 = require("../protocol/create-method-url.js");
const invoke_implementation_js_1 = require("../protocol/invoke-implementation.js");
const wkt_1 = require("@bufbuild/protobuf/wkt");
const protocolName = "connect";
const methodPost = "POST";
const methodGet = "GET";
/**
 * Create a factory that creates Connect handlers.
 */
function createHandlerFactory(options) {
    const opt = (0, universal_handler_js_1.validateUniversalHandlerOptions)(options);
    const endStreamSerialization = (0, end_stream_js_1.createEndStreamSerialization)(opt.jsonOptions);
    function fact(spec) {
        let h;
        let contentTypeRegExp;
        const serialization = (0, serialization_js_1.createMethodSerializationLookup)(spec.method, opt.binaryOptions, opt.jsonOptions, opt);
        switch (spec.kind) {
            case "unary":
                contentTypeRegExp = content_type_js_1.contentTypeUnaryRegExp;
                h = createUnaryHandler(opt, spec, serialization);
                break;
            default:
                contentTypeRegExp = content_type_js_1.contentTypeStreamRegExp;
                h = createStreamHandler(opt, spec, serialization, endStreamSerialization);
                break;
        }
        const allowedMethods = [methodPost];
        if (spec.method.idempotency === wkt_1.MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS) {
            allowedMethods.push(methodGet);
        }
        return Object.assign(h, {
            protocolNames: [protocolName],
            supportedContentType: (0, content_type_matcher_js_1.contentTypeMatcher)(contentTypeRegExp),
            allowedMethods,
            requestPath: (0, create_method_url_js_1.createMethodUrl)("/", spec.method),
            service: spec.method.parent,
            method: spec.method,
        });
    }
    fact.protocolName = protocolName;
    return fact;
}
function createUnaryHandler(opt, spec, serialization) {
    return async function handle(req) {
        const isGet = req.method == methodGet;
        if (isGet &&
            spec.method.idempotency != wkt_1.MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS) {
            return universal_js_1.uResponseMethodNotAllowed;
        }
        const queryParams = new URL(req.url).searchParams;
        const compressionRequested = isGet
            ? queryParams.get(query_params_js_1.paramCompression)
            : req.header.get(headers_js_1.headerUnaryEncoding);
        const type = isGet
            ? (0, content_type_js_1.parseEncodingQuery)(queryParams.get(query_params_js_1.paramEncoding))
            : (0, content_type_js_1.parseContentType)(req.header.get(headers_js_1.headerContentType));
        if (type == undefined || type.stream) {
            return universal_js_1.uResponseUnsupportedMediaType;
        }
        const timeout = (0, parse_timeout_js_1.parseTimeout)(req.header.get(headers_js_1.headerTimeout), opt.maxTimeoutMs);
        const context = (0, implementation_js_1.createHandlerContext)(Object.assign(Object.assign({}, spec), { service: spec.method.parent, requestMethod: req.method, protocolName, timeoutMs: timeout.timeoutMs, shutdownSignal: opt.shutdownSignal, requestSignal: req.signal, requestHeader: req.header, url: req.url, responseHeader: {
                [headers_js_1.headerContentType]: type.binary
                    ? content_type_js_1.contentTypeUnaryProto
                    : content_type_js_1.contentTypeUnaryJson,
            }, contextValues: req.contextValues }));
        const compression = (0, compression_js_1.compressionNegotiate)(opt.acceptCompression, compressionRequested, req.header.get(headers_js_1.headerUnaryAcceptEncoding), headers_js_1.headerUnaryAcceptEncoding);
        let status = universal_js_1.uResponseOk.status;
        let body;
        try {
            if (opt.requireConnectProtocolHeader) {
                if (isGet) {
                    (0, version_js_1.requireProtocolVersionParam)(queryParams);
                }
                else {
                    (0, version_js_1.requireProtocolVersionHeader)(req.header);
                }
            }
            // raise compression error to serialize it as a error response
            if (compression.error) {
                throw compression.error;
            }
            // raise timeout parsing error to serialize it as a trailer status
            if (timeout.error) {
                throw timeout.error;
            }
            let reqBody;
            if (isGet) {
                reqBody = await readUnaryMessageFromQuery(opt.readMaxBytes, compression.request, queryParams);
            }
            else {
                reqBody = await readUnaryMessageFromBody(opt.readMaxBytes, compression.request, req);
            }
            const input = parseUnaryMessage(spec.method, type.binary, serialization, reqBody);
            const output = await (0, invoke_implementation_js_1.invokeUnaryImplementation)(spec, context, input, opt.interceptors);
            body = serialization.getO(type.binary).serialize(output);
        }
        catch (e) {
            context.abort(e);
            let error;
            if (e instanceof connect_error_js_1.ConnectError) {
                error = e;
            }
            else {
                error = new connect_error_js_1.ConnectError("internal error", code_js_1.Code.Internal, undefined, undefined, e);
            }
            status = (0, http_status_js_1.codeToHttpStatus)(error.code);
            context.responseHeader.set(headers_js_1.headerContentType, content_type_js_1.contentTypeUnaryJson);
            error.metadata.forEach((value, key) => {
                context.responseHeader.set(key, value);
            });
            body = (0, error_json_js_1.errorToJsonBytes)(error, opt.jsonOptions);
        }
        finally {
            context.abort();
        }
        if (compression.response && body.byteLength >= opt.compressMinBytes) {
            body = await compression.response.compress(body);
            context.responseHeader.set(headers_js_1.headerUnaryEncoding, compression.response.name);
        }
        const header = (0, trailer_mux_js_1.trailerMux)(context.responseHeader, context.responseTrailer);
        header.set(headers_js_1.headerUnaryContentLength, body.byteLength.toString(10));
        return {
            status,
            body: (0, async_iterable_js_1.createAsyncIterable)([body]),
            header,
        };
    };
}
async function readUnaryMessageFromBody(readMaxBytes, compression, request) {
    if (typeof request.body == "object" &&
        request.body !== null &&
        Symbol.asyncIterator in request.body) {
        let reqBytes = await (0, async_iterable_js_1.readAllBytes)(request.body, readMaxBytes, request.header.get(headers_js_1.headerUnaryContentLength));
        if (compression) {
            reqBytes = await compression.decompress(reqBytes, readMaxBytes);
        }
        return reqBytes;
    }
    return request.body;
}
async function readUnaryMessageFromQuery(readMaxBytes, compression, queryParams) {
    var _a;
    const base64 = queryParams.get(query_params_js_1.paramBase64);
    const message = (_a = queryParams.get(query_params_js_1.paramMessage)) !== null && _a !== void 0 ? _a : "";
    let decoded;
    if (base64 === "1") {
        decoded = (0, wire_1.base64Decode)(message);
    }
    else {
        decoded = new TextEncoder().encode(message);
    }
    if (compression) {
        decoded = await compression.decompress(decoded, readMaxBytes);
    }
    return decoded;
}
function parseUnaryMessage(method, useBinaryFormat, serialization, input) {
    if (input instanceof Uint8Array) {
        return serialization.getI(useBinaryFormat).parse(input);
    }
    if (useBinaryFormat) {
        throw new connect_error_js_1.ConnectError("received parsed JSON request body, but content-type indicates binary format", code_js_1.Code.Internal);
    }
    try {
        return (0, protobuf_1.fromJson)(method.input, input);
    }
    catch (e) {
        throw connect_error_js_1.ConnectError.from(e, code_js_1.Code.InvalidArgument);
    }
}
function createStreamHandler(opt, spec, serialization, endStreamSerialization) {
    return async function handle(req) {
        (0, universal_js_1.assertByteStreamRequest)(req);
        const type = (0, content_type_js_1.parseContentType)(req.header.get(headers_js_1.headerContentType));
        if (type == undefined || !type.stream) {
            return universal_js_1.uResponseUnsupportedMediaType;
        }
        if (req.method !== methodPost) {
            return universal_js_1.uResponseMethodNotAllowed;
        }
        const timeout = (0, parse_timeout_js_1.parseTimeout)(req.header.get(headers_js_1.headerTimeout), opt.maxTimeoutMs);
        const context = (0, implementation_js_1.createHandlerContext)(Object.assign(Object.assign({}, spec), { service: spec.method.parent, requestMethod: req.method, protocolName, timeoutMs: timeout.timeoutMs, shutdownSignal: opt.shutdownSignal, requestSignal: req.signal, requestHeader: req.header, url: req.url, responseHeader: {
                [headers_js_1.headerContentType]: type.binary
                    ? content_type_js_1.contentTypeStreamProto
                    : content_type_js_1.contentTypeStreamJson,
            }, contextValues: req.contextValues }));
        const compression = (0, compression_js_1.compressionNegotiate)(opt.acceptCompression, req.header.get(headers_js_1.headerStreamEncoding), req.header.get(headers_js_1.headerStreamAcceptEncoding), headers_js_1.headerStreamAcceptEncoding);
        if (compression.response) {
            context.responseHeader.set(headers_js_1.headerStreamEncoding, compression.response.name);
        }
        // We split the pipeline into two parts: The request iterator, and the
        // response iterator. We do this because the request iterator is responsible
        // for parsing the request body, and we don't want write errors of the response
        // iterator to affect the request iterator.
        const inputIt = (0, async_iterable_js_1.pipe)(req.body, (0, async_iterable_js_1.transformPrepend)(() => {
            if (opt.requireConnectProtocolHeader) {
                (0, version_js_1.requireProtocolVersionHeader)(req.header);
            }
            // raise compression error to serialize it as the end stream response
            if (compression.error)
                throw compression.error;
            // raise timeout parsing error to serialize it as a trailer status
            if (timeout.error)
                throw timeout.error;
            return undefined;
        }), (0, async_iterable_js_1.transformSplitEnvelope)(opt.readMaxBytes), (0, async_iterable_js_1.transformDecompressEnvelope)(compression.request, opt.readMaxBytes), (0, async_iterable_js_1.transformParseEnvelope)(serialization.getI(type.binary), end_stream_js_1.endStreamFlag));
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
            const end = {
                metadata: context.responseTrailer,
            };
            if (e instanceof connect_error_js_1.ConnectError) {
                end.error = e;
            }
            else if (e !== undefined) {
                end.error = new connect_error_js_1.ConnectError("internal error", code_js_1.Code.Internal, undefined, undefined, e);
            }
            return {
                flags: end_stream_js_1.endStreamFlag,
                data: endStreamSerialization.serialize(end),
            };
        }), (0, async_iterable_js_1.transformCompressEnvelope)(compression.response, opt.compressMinBytes), (0, async_iterable_js_1.transformJoinEnvelopes)(), { propagateDownStreamError: true });
        return Object.assign(Object.assign({}, universal_js_1.uResponseOk), { 
            // We wait for the first response body bytes before resolving, so that
            // implementations have a chance to add headers before an adapter commits
            // them to the wire.
            body: await (0, async_iterable_js_1.untilFirst)(outputIt), header: context.responseHeader });
    };
}
