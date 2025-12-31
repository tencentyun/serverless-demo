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
exports.transformConnectPostToGetRequest = transformConnectPostToGetRequest;
const wire_1 = require("@bufbuild/protobuf/wire");
const headers_js_1 = require("./headers.js");
const version_js_1 = require("./version.js");
const contentTypePrefix = "application/";
function encodeMessageForUrl(message, useBase64) {
    if (useBase64) {
        return (0, wire_1.base64Encode)(message, "url");
    }
    else {
        return encodeURIComponent(new TextDecoder().decode(message));
    }
}
/**
 * @private Internal code, does not follow semantic versioning.
 */
function transformConnectPostToGetRequest(request, message, useBase64) {
    let query = `?connect=v${version_js_1.protocolVersion}`;
    const contentType = request.header.get(headers_js_1.headerContentType);
    if ((contentType === null || contentType === void 0 ? void 0 : contentType.indexOf(contentTypePrefix)) === 0) {
        query +=
            "&encoding=" +
                encodeURIComponent(contentType.slice(contentTypePrefix.length));
    }
    const compression = request.header.get(headers_js_1.headerUnaryEncoding);
    if (compression !== null && compression !== "identity") {
        query += "&compression=" + encodeURIComponent(compression);
        // Force base64 for compressed payloads.
        useBase64 = true;
    }
    if (useBase64) {
        query += "&base64=1";
    }
    query += "&message=" + encodeMessageForUrl(message, useBase64);
    const url = request.url + query;
    // Omit headers that are not used for unary GET requests.
    const header = new Headers(request.header);
    [
        headers_js_1.headerProtocolVersion,
        headers_js_1.headerContentType,
        headers_js_1.headerUnaryContentLength,
        headers_js_1.headerUnaryEncoding,
        headers_js_1.headerUnaryAcceptEncoding,
    ].forEach((h) => header.delete(h));
    return Object.assign(Object.assign({}, request), { requestMethod: "GET", url,
        header });
}
