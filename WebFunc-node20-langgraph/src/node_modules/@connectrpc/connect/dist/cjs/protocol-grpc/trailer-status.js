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
exports.grpcStatusOk = void 0;
exports.setTrailerStatus = setTrailerStatus;
exports.findTrailerError = findTrailerError;
const status_pb_js_1 = require("./gen/status_pb.js");
const connect_error_js_1 = require("../connect-error.js");
const http_headers_js_1 = require("../http-headers.js");
const code_js_1 = require("../code.js");
const wkt_1 = require("@bufbuild/protobuf/wkt");
const headers_js_1 = require("./headers.js");
const protobuf_1 = require("@bufbuild/protobuf");
/**
 * The value of the Grpc-Status header or trailer in case of success.
 * Used by the gRPC and gRPC-web protocols.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.grpcStatusOk = "0";
/**
 * Sets the fields "grpc-status" and "grpc-message" in the given
 * Headers object.
 * If an error is given and contains error details, the function
 * will also set the field "grpc-status-details-bin" with an encoded
 * google.rpc.Status message including the error details.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function setTrailerStatus(target, error) {
    if (error) {
        target.set(headers_js_1.headerGrpcStatus, error.code.toString(10));
        target.set(headers_js_1.headerGrpcMessage, encodeURIComponent(error.rawMessage));
        if (error.details.length > 0) {
            const status = (0, protobuf_1.create)(status_pb_js_1.StatusSchema, {
                code: error.code,
                message: error.rawMessage,
                details: error.details.map((detail) => "desc" in detail
                    ? (0, wkt_1.anyPack)(detail.desc, (0, protobuf_1.create)(detail.desc, detail.value))
                    : {
                        typeUrl: `type.googleapis.com/${detail.type}`,
                        value: detail.value,
                    }),
            });
            target.set(headers_js_1.headerStatusDetailsBin, (0, http_headers_js_1.encodeBinaryHeader)(status, status_pb_js_1.StatusSchema));
        }
    }
    else {
        target.set(headers_js_1.headerGrpcStatus, exports.grpcStatusOk.toString());
    }
    return target;
}
/**
 * Find an error status in the given Headers object, which can be either
 * a trailer, or a header (as allowed for so-called trailers-only responses).
 * The field "grpc-status-details-bin" is inspected, and if not present,
 * the fields "grpc-status" and "grpc-message" are used.
 * Returns an error only if the gRPC status code is > 0.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function findTrailerError(headerOrTrailer) {
    // TODO
    // let code: Code;
    // let message: string = "";
    var _a;
    // Prefer the protobuf-encoded data to the grpc-status header.
    const statusBytes = headerOrTrailer.get(headers_js_1.headerStatusDetailsBin);
    if (statusBytes != null) {
        const status = (0, http_headers_js_1.decodeBinaryHeader)(statusBytes, status_pb_js_1.StatusSchema);
        if (status.code == 0) {
            return undefined;
        }
        const error = new connect_error_js_1.ConnectError(status.message, status.code, headerOrTrailer);
        error.details = status.details.map((any) => ({
            type: any.typeUrl.substring(any.typeUrl.lastIndexOf("/") + 1),
            value: any.value,
        }));
        return error;
    }
    const grpcStatus = headerOrTrailer.get(headers_js_1.headerGrpcStatus);
    if (grpcStatus != null) {
        if (grpcStatus === exports.grpcStatusOk) {
            return undefined;
        }
        const code = parseInt(grpcStatus, 10);
        if (code in code_js_1.Code) {
            return new connect_error_js_1.ConnectError(decodeURIComponent((_a = headerOrTrailer.get(headers_js_1.headerGrpcMessage)) !== null && _a !== void 0 ? _a : ""), code, headerOrTrailer);
        }
        return new connect_error_js_1.ConnectError(`invalid grpc-status: ${grpcStatus}`, code_js_1.Code.Internal, headerOrTrailer);
    }
    return undefined;
}
