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
import { fromJson } from "@bufbuild/protobuf";
import { base64Decode } from "@bufbuild/protobuf/wire";
import { Code } from "../code.js";
import { ConnectError } from "../connect-error.js";
import { createHandlerContext } from "../implementation.js";
import { contentTypeStreamJson, contentTypeStreamProto, contentTypeStreamRegExp, contentTypeUnaryJson, contentTypeUnaryProto, contentTypeUnaryRegExp, parseContentType, parseEncodingQuery, } from "./content-type.js";
import { createEndStreamSerialization, endStreamFlag } from "./end-stream.js";
import { errorToJsonBytes } from "./error-json.js";
import { headerContentType, headerStreamAcceptEncoding, headerStreamEncoding, headerTimeout, headerUnaryAcceptEncoding, headerUnaryContentLength, headerUnaryEncoding, } from "./headers.js";
import { codeToHttpStatus } from "./http-status.js";
import { parseTimeout } from "./parse-timeout.js";
import { paramBase64, paramCompression, paramEncoding, paramMessage, } from "./query-params.js";
import { trailerMux } from "./trailer-mux.js";
import { requireProtocolVersionHeader, requireProtocolVersionParam, } from "./version.js";
import { compressionNegotiate } from "../protocol/compression.js";
import { createMethodSerializationLookup } from "../protocol/serialization.js";
import { validateUniversalHandlerOptions } from "../protocol/universal-handler.js";
import { assertByteStreamRequest, uResponseMethodNotAllowed, uResponseOk, uResponseUnsupportedMediaType, } from "../protocol/universal.js";
import { createAsyncIterable, pipe, readAllBytes, transformCatchFinally, transformCompressEnvelope, transformDecompressEnvelope, transformJoinEnvelopes, transformParseEnvelope, transformPrepend, transformSerializeEnvelope, transformSplitEnvelope, untilFirst, } from "../protocol/async-iterable.js";
import { contentTypeMatcher } from "../protocol/content-type-matcher.js";
import { createMethodUrl } from "../protocol/create-method-url.js";
import { invokeUnaryImplementation, transformInvokeImplementation, } from "../protocol/invoke-implementation.js";
import { MethodOptions_IdempotencyLevel } from "@bufbuild/protobuf/wkt";
const protocolName = "connect";
const methodPost = "POST";
const methodGet = "GET";
/**
 * Create a factory that creates Connect handlers.
 */
export function createHandlerFactory(options) {
    const opt = validateUniversalHandlerOptions(options);
    const endStreamSerialization = createEndStreamSerialization(opt.jsonOptions);
    function fact(spec) {
        let h;
        let contentTypeRegExp;
        const serialization = createMethodSerializationLookup(spec.method, opt.binaryOptions, opt.jsonOptions, opt);
        switch (spec.kind) {
            case "unary":
                contentTypeRegExp = contentTypeUnaryRegExp;
                h = createUnaryHandler(opt, spec, serialization);
                break;
            default:
                contentTypeRegExp = contentTypeStreamRegExp;
                h = createStreamHandler(opt, spec, serialization, endStreamSerialization);
                break;
        }
        const allowedMethods = [methodPost];
        if (spec.method.idempotency === MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS) {
            allowedMethods.push(methodGet);
        }
        return Object.assign(h, {
            protocolNames: [protocolName],
            supportedContentType: contentTypeMatcher(contentTypeRegExp),
            allowedMethods,
            requestPath: createMethodUrl("/", spec.method),
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
            spec.method.idempotency != MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS) {
            return uResponseMethodNotAllowed;
        }
        const queryParams = new URL(req.url).searchParams;
        const compressionRequested = isGet
            ? queryParams.get(paramCompression)
            : req.header.get(headerUnaryEncoding);
        const type = isGet
            ? parseEncodingQuery(queryParams.get(paramEncoding))
            : parseContentType(req.header.get(headerContentType));
        if (type == undefined || type.stream) {
            return uResponseUnsupportedMediaType;
        }
        const timeout = parseTimeout(req.header.get(headerTimeout), opt.maxTimeoutMs);
        const context = createHandlerContext(Object.assign(Object.assign({}, spec), { service: spec.method.parent, requestMethod: req.method, protocolName, timeoutMs: timeout.timeoutMs, shutdownSignal: opt.shutdownSignal, requestSignal: req.signal, requestHeader: req.header, url: req.url, responseHeader: {
                [headerContentType]: type.binary
                    ? contentTypeUnaryProto
                    : contentTypeUnaryJson,
            }, contextValues: req.contextValues }));
        const compression = compressionNegotiate(opt.acceptCompression, compressionRequested, req.header.get(headerUnaryAcceptEncoding), headerUnaryAcceptEncoding);
        let status = uResponseOk.status;
        let body;
        try {
            if (opt.requireConnectProtocolHeader) {
                if (isGet) {
                    requireProtocolVersionParam(queryParams);
                }
                else {
                    requireProtocolVersionHeader(req.header);
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
            const output = await invokeUnaryImplementation(spec, context, input, opt.interceptors);
            body = serialization.getO(type.binary).serialize(output);
        }
        catch (e) {
            context.abort(e);
            let error;
            if (e instanceof ConnectError) {
                error = e;
            }
            else {
                error = new ConnectError("internal error", Code.Internal, undefined, undefined, e);
            }
            status = codeToHttpStatus(error.code);
            context.responseHeader.set(headerContentType, contentTypeUnaryJson);
            error.metadata.forEach((value, key) => {
                context.responseHeader.set(key, value);
            });
            body = errorToJsonBytes(error, opt.jsonOptions);
        }
        finally {
            context.abort();
        }
        if (compression.response && body.byteLength >= opt.compressMinBytes) {
            body = await compression.response.compress(body);
            context.responseHeader.set(headerUnaryEncoding, compression.response.name);
        }
        const header = trailerMux(context.responseHeader, context.responseTrailer);
        header.set(headerUnaryContentLength, body.byteLength.toString(10));
        return {
            status,
            body: createAsyncIterable([body]),
            header,
        };
    };
}
async function readUnaryMessageFromBody(readMaxBytes, compression, request) {
    if (typeof request.body == "object" &&
        request.body !== null &&
        Symbol.asyncIterator in request.body) {
        let reqBytes = await readAllBytes(request.body, readMaxBytes, request.header.get(headerUnaryContentLength));
        if (compression) {
            reqBytes = await compression.decompress(reqBytes, readMaxBytes);
        }
        return reqBytes;
    }
    return request.body;
}
async function readUnaryMessageFromQuery(readMaxBytes, compression, queryParams) {
    var _a;
    const base64 = queryParams.get(paramBase64);
    const message = (_a = queryParams.get(paramMessage)) !== null && _a !== void 0 ? _a : "";
    let decoded;
    if (base64 === "1") {
        decoded = base64Decode(message);
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
        throw new ConnectError("received parsed JSON request body, but content-type indicates binary format", Code.Internal);
    }
    try {
        return fromJson(method.input, input);
    }
    catch (e) {
        throw ConnectError.from(e, Code.InvalidArgument);
    }
}
function createStreamHandler(opt, spec, serialization, endStreamSerialization) {
    return async function handle(req) {
        assertByteStreamRequest(req);
        const type = parseContentType(req.header.get(headerContentType));
        if (type == undefined || !type.stream) {
            return uResponseUnsupportedMediaType;
        }
        if (req.method !== methodPost) {
            return uResponseMethodNotAllowed;
        }
        const timeout = parseTimeout(req.header.get(headerTimeout), opt.maxTimeoutMs);
        const context = createHandlerContext(Object.assign(Object.assign({}, spec), { service: spec.method.parent, requestMethod: req.method, protocolName, timeoutMs: timeout.timeoutMs, shutdownSignal: opt.shutdownSignal, requestSignal: req.signal, requestHeader: req.header, url: req.url, responseHeader: {
                [headerContentType]: type.binary
                    ? contentTypeStreamProto
                    : contentTypeStreamJson,
            }, contextValues: req.contextValues }));
        const compression = compressionNegotiate(opt.acceptCompression, req.header.get(headerStreamEncoding), req.header.get(headerStreamAcceptEncoding), headerStreamAcceptEncoding);
        if (compression.response) {
            context.responseHeader.set(headerStreamEncoding, compression.response.name);
        }
        // We split the pipeline into two parts: The request iterator, and the
        // response iterator. We do this because the request iterator is responsible
        // for parsing the request body, and we don't want write errors of the response
        // iterator to affect the request iterator.
        const inputIt = pipe(req.body, transformPrepend(() => {
            if (opt.requireConnectProtocolHeader) {
                requireProtocolVersionHeader(req.header);
            }
            // raise compression error to serialize it as the end stream response
            if (compression.error)
                throw compression.error;
            // raise timeout parsing error to serialize it as a trailer status
            if (timeout.error)
                throw timeout.error;
            return undefined;
        }), transformSplitEnvelope(opt.readMaxBytes), transformDecompressEnvelope(compression.request, opt.readMaxBytes), transformParseEnvelope(serialization.getI(type.binary), endStreamFlag));
        const it = transformInvokeImplementation(spec, context, opt.interceptors)(inputIt)[Symbol.asyncIterator]();
        const outputIt = pipe(
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
        }, transformSerializeEnvelope(serialization.getO(type.binary)), transformCatchFinally((e) => {
            context.abort(e);
            const end = {
                metadata: context.responseTrailer,
            };
            if (e instanceof ConnectError) {
                end.error = e;
            }
            else if (e !== undefined) {
                end.error = new ConnectError("internal error", Code.Internal, undefined, undefined, e);
            }
            return {
                flags: endStreamFlag,
                data: endStreamSerialization.serialize(end),
            };
        }), transformCompressEnvelope(compression.response, opt.compressMinBytes), transformJoinEnvelopes(), { propagateDownStreamError: true });
        return Object.assign(Object.assign({}, uResponseOk), { 
            // We wait for the first response body bytes before resolving, so that
            // implementations have a chance to add headers before an adapter commits
            // them to the wire.
            body: await untilFirst(outputIt), header: context.responseHeader });
    };
}
