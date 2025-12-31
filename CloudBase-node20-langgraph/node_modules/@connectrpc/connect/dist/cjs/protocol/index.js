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
exports.uResponseOk = exports.assertByteStreamRequest = exports.createDeadlineSignal = exports.getAbortSignalReason = exports.createLinkedAbortController = exports.transformInvokeImplementation = exports.invokeUnaryImplementation = exports.contentTypeMatcher = exports.untilFirst = exports.readAllBytes = exports.createAsyncIterable = exports.createWritableIterable = exports.makeIterableAbortable = exports.sinkAllBytes = exports.sinkAll = exports.pipeTo = exports.transformParseEnvelope = exports.transformSerializeEnvelope = exports.transformSplitEnvelope = exports.transformJoinEnvelopes = exports.transformDecompressEnvelope = exports.transformCompressEnvelope = exports.transformReadAllBytes = exports.transformPrepend = exports.transformAppend = exports.transformCatchFinally = exports.transformCatch = exports.pipe = exports.compressionNegotiate = exports.compressedFlag = exports.createEnvelopeReadableStream = exports.envelopeCompress = exports.envelopeDecompress = exports.encodeEnvelopes = exports.encodeEnvelope = exports.validateReadWriteMaxBytes = exports.limitSerialization = exports.getJsonOptions = exports.createClientMethodSerializers = exports.createMethodSerializationLookup = exports.runStreamingCall = exports.runUnaryCall = exports.universalServerResponseToFetch = exports.universalServerRequestFromFetch = exports.universalClientResponseFromFetch = exports.universalClientRequestToFetch = exports.createFetchHandler = exports.createFetchClient = exports.createUniversalHandlerClient = exports.createMethodUrl = void 0;
exports.createUniversalMethodHandler = exports.createUniversalServiceHandlers = exports.validateUniversalHandlerOptions = exports.uResponseVersionNotSupported = exports.uResponseMethodNotAllowed = exports.uResponseUnsupportedMediaType = exports.uResponseNotFound = void 0;
var create_method_url_js_1 = require("./create-method-url.js");
Object.defineProperty(exports, "createMethodUrl", { enumerable: true, get: function () { return create_method_url_js_1.createMethodUrl; } });
var universal_handler_client_js_1 = require("./universal-handler-client.js");
Object.defineProperty(exports, "createUniversalHandlerClient", { enumerable: true, get: function () { return universal_handler_client_js_1.createUniversalHandlerClient; } });
var universal_fetch_js_1 = require("./universal-fetch.js");
Object.defineProperty(exports, "createFetchClient", { enumerable: true, get: function () { return universal_fetch_js_1.createFetchClient; } });
Object.defineProperty(exports, "createFetchHandler", { enumerable: true, get: function () { return universal_fetch_js_1.createFetchHandler; } });
Object.defineProperty(exports, "universalClientRequestToFetch", { enumerable: true, get: function () { return universal_fetch_js_1.universalClientRequestToFetch; } });
Object.defineProperty(exports, "universalClientResponseFromFetch", { enumerable: true, get: function () { return universal_fetch_js_1.universalClientResponseFromFetch; } });
Object.defineProperty(exports, "universalServerRequestFromFetch", { enumerable: true, get: function () { return universal_fetch_js_1.universalServerRequestFromFetch; } });
Object.defineProperty(exports, "universalServerResponseToFetch", { enumerable: true, get: function () { return universal_fetch_js_1.universalServerResponseToFetch; } });
var run_call_js_1 = require("./run-call.js");
Object.defineProperty(exports, "runUnaryCall", { enumerable: true, get: function () { return run_call_js_1.runUnaryCall; } });
Object.defineProperty(exports, "runStreamingCall", { enumerable: true, get: function () { return run_call_js_1.runStreamingCall; } });
// All exports below are private — internal code that does not follow semantic
// versioning.
// We will try hard to avoid breaking changes, but if you depend on the
// following exports, we recommend that you do so with an exact version
// constraint (no ~ or ^).
var serialization_js_1 = require("./serialization.js");
Object.defineProperty(exports, "createMethodSerializationLookup", { enumerable: true, get: function () { return serialization_js_1.createMethodSerializationLookup; } });
Object.defineProperty(exports, "createClientMethodSerializers", { enumerable: true, get: function () { return serialization_js_1.createClientMethodSerializers; } });
Object.defineProperty(exports, "getJsonOptions", { enumerable: true, get: function () { return serialization_js_1.getJsonOptions; } });
Object.defineProperty(exports, "limitSerialization", { enumerable: true, get: function () { return serialization_js_1.limitSerialization; } });
var limit_io_js_1 = require("./limit-io.js");
Object.defineProperty(exports, "validateReadWriteMaxBytes", { enumerable: true, get: function () { return limit_io_js_1.validateReadWriteMaxBytes; } });
var envelope_js_1 = require("./envelope.js");
Object.defineProperty(exports, "encodeEnvelope", { enumerable: true, get: function () { return envelope_js_1.encodeEnvelope; } });
Object.defineProperty(exports, "encodeEnvelopes", { enumerable: true, get: function () { return envelope_js_1.encodeEnvelopes; } });
Object.defineProperty(exports, "envelopeDecompress", { enumerable: true, get: function () { return envelope_js_1.envelopeDecompress; } });
Object.defineProperty(exports, "envelopeCompress", { enumerable: true, get: function () { return envelope_js_1.envelopeCompress; } });
Object.defineProperty(exports, "createEnvelopeReadableStream", { enumerable: true, get: function () { return envelope_js_1.createEnvelopeReadableStream; } });
var compression_js_1 = require("./compression.js");
Object.defineProperty(exports, "compressedFlag", { enumerable: true, get: function () { return compression_js_1.compressedFlag; } });
Object.defineProperty(exports, "compressionNegotiate", { enumerable: true, get: function () { return compression_js_1.compressionNegotiate; } });
var async_iterable_js_1 = require("./async-iterable.js");
Object.defineProperty(exports, "pipe", { enumerable: true, get: function () { return async_iterable_js_1.pipe; } });
Object.defineProperty(exports, "transformCatch", { enumerable: true, get: function () { return async_iterable_js_1.transformCatch; } });
Object.defineProperty(exports, "transformCatchFinally", { enumerable: true, get: function () { return async_iterable_js_1.transformCatchFinally; } });
Object.defineProperty(exports, "transformAppend", { enumerable: true, get: function () { return async_iterable_js_1.transformAppend; } });
Object.defineProperty(exports, "transformPrepend", { enumerable: true, get: function () { return async_iterable_js_1.transformPrepend; } });
Object.defineProperty(exports, "transformReadAllBytes", { enumerable: true, get: function () { return async_iterable_js_1.transformReadAllBytes; } });
Object.defineProperty(exports, "transformCompressEnvelope", { enumerable: true, get: function () { return async_iterable_js_1.transformCompressEnvelope; } });
Object.defineProperty(exports, "transformDecompressEnvelope", { enumerable: true, get: function () { return async_iterable_js_1.transformDecompressEnvelope; } });
Object.defineProperty(exports, "transformJoinEnvelopes", { enumerable: true, get: function () { return async_iterable_js_1.transformJoinEnvelopes; } });
Object.defineProperty(exports, "transformSplitEnvelope", { enumerable: true, get: function () { return async_iterable_js_1.transformSplitEnvelope; } });
Object.defineProperty(exports, "transformSerializeEnvelope", { enumerable: true, get: function () { return async_iterable_js_1.transformSerializeEnvelope; } });
Object.defineProperty(exports, "transformParseEnvelope", { enumerable: true, get: function () { return async_iterable_js_1.transformParseEnvelope; } });
Object.defineProperty(exports, "pipeTo", { enumerable: true, get: function () { return async_iterable_js_1.pipeTo; } });
Object.defineProperty(exports, "sinkAll", { enumerable: true, get: function () { return async_iterable_js_1.sinkAll; } });
Object.defineProperty(exports, "sinkAllBytes", { enumerable: true, get: function () { return async_iterable_js_1.sinkAllBytes; } });
Object.defineProperty(exports, "makeIterableAbortable", { enumerable: true, get: function () { return async_iterable_js_1.makeIterableAbortable; } });
Object.defineProperty(exports, "createWritableIterable", { enumerable: true, get: function () { return async_iterable_js_1.createWritableIterable; } });
Object.defineProperty(exports, "createAsyncIterable", { enumerable: true, get: function () { return async_iterable_js_1.createAsyncIterable; } });
Object.defineProperty(exports, "readAllBytes", { enumerable: true, get: function () { return async_iterable_js_1.readAllBytes; } });
Object.defineProperty(exports, "untilFirst", { enumerable: true, get: function () { return async_iterable_js_1.untilFirst; } });
var content_type_matcher_js_1 = require("./content-type-matcher.js");
Object.defineProperty(exports, "contentTypeMatcher", { enumerable: true, get: function () { return content_type_matcher_js_1.contentTypeMatcher; } });
var invoke_implementation_js_1 = require("./invoke-implementation.js");
Object.defineProperty(exports, "invokeUnaryImplementation", { enumerable: true, get: function () { return invoke_implementation_js_1.invokeUnaryImplementation; } });
Object.defineProperty(exports, "transformInvokeImplementation", { enumerable: true, get: function () { return invoke_implementation_js_1.transformInvokeImplementation; } });
var signals_js_1 = require("./signals.js");
Object.defineProperty(exports, "createLinkedAbortController", { enumerable: true, get: function () { return signals_js_1.createLinkedAbortController; } });
Object.defineProperty(exports, "getAbortSignalReason", { enumerable: true, get: function () { return signals_js_1.getAbortSignalReason; } });
Object.defineProperty(exports, "createDeadlineSignal", { enumerable: true, get: function () { return signals_js_1.createDeadlineSignal; } });
var universal_js_1 = require("./universal.js");
Object.defineProperty(exports, "assertByteStreamRequest", { enumerable: true, get: function () { return universal_js_1.assertByteStreamRequest; } });
Object.defineProperty(exports, "uResponseOk", { enumerable: true, get: function () { return universal_js_1.uResponseOk; } });
Object.defineProperty(exports, "uResponseNotFound", { enumerable: true, get: function () { return universal_js_1.uResponseNotFound; } });
Object.defineProperty(exports, "uResponseUnsupportedMediaType", { enumerable: true, get: function () { return universal_js_1.uResponseUnsupportedMediaType; } });
Object.defineProperty(exports, "uResponseMethodNotAllowed", { enumerable: true, get: function () { return universal_js_1.uResponseMethodNotAllowed; } });
Object.defineProperty(exports, "uResponseVersionNotSupported", { enumerable: true, get: function () { return universal_js_1.uResponseVersionNotSupported; } });
var universal_handler_js_1 = require("./universal-handler.js");
Object.defineProperty(exports, "validateUniversalHandlerOptions", { enumerable: true, get: function () { return universal_handler_js_1.validateUniversalHandlerOptions; } });
Object.defineProperty(exports, "createUniversalServiceHandlers", { enumerable: true, get: function () { return universal_handler_js_1.createUniversalServiceHandlers; } });
Object.defineProperty(exports, "createUniversalMethodHandler", { enumerable: true, get: function () { return universal_handler_js_1.createUniversalMethodHandler; } });
