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
import { base64Encode } from "@bufbuild/protobuf/wire";
import { headerContentType, headerProtocolVersion, headerUnaryAcceptEncoding, headerUnaryContentLength, headerUnaryEncoding, } from "./headers.js";
import { protocolVersion } from "./version.js";
const contentTypePrefix = "application/";
function encodeMessageForUrl(message, useBase64) {
    if (useBase64) {
        return base64Encode(message, "url");
    }
    else {
        return encodeURIComponent(new TextDecoder().decode(message));
    }
}
/**
 * @private Internal code, does not follow semantic versioning.
 */
export function transformConnectPostToGetRequest(request, message, useBase64) {
    let query = `?connect=v${protocolVersion}`;
    const contentType = request.header.get(headerContentType);
    if ((contentType === null || contentType === void 0 ? void 0 : contentType.indexOf(contentTypePrefix)) === 0) {
        query +=
            "&encoding=" +
                encodeURIComponent(contentType.slice(contentTypePrefix.length));
    }
    const compression = request.header.get(headerUnaryEncoding);
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
        headerProtocolVersion,
        headerContentType,
        headerUnaryContentLength,
        headerUnaryEncoding,
        headerUnaryAcceptEncoding,
    ].forEach((h) => header.delete(h));
    return Object.assign(Object.assign({}, request), { requestMethod: "GET", url,
        header });
}
