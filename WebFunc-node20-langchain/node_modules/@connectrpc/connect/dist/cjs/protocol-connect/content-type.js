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
exports.contentTypeStreamJson = exports.contentTypeStreamProto = exports.contentTypeUnaryJson = exports.contentTypeUnaryProto = exports.contentTypeStreamRegExp = exports.contentTypeUnaryRegExp = exports.contentTypeRegExp = void 0;
exports.parseContentType = parseContentType;
exports.parseEncodingQuery = parseEncodingQuery;
/**
 * Regular Expression that matches any valid Connect Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.contentTypeRegExp = /^application\/(connect\+)?(?:(json)(?:; ?charset=utf-?8)?|(proto))$/i;
/**
 * Regular Expression that matches a Connect unary Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.contentTypeUnaryRegExp = /^application\/(?:json(?:; ?charset=utf-?8)?|proto)$/i;
/**
 * Regular Expression that matches a Connect streaming Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.contentTypeStreamRegExp = /^application\/connect\+?(?:json(?:; ?charset=utf-?8)?|proto)$/i;
exports.contentTypeUnaryProto = "application/proto";
exports.contentTypeUnaryJson = "application/json";
exports.contentTypeStreamProto = "application/connect+proto";
exports.contentTypeStreamJson = "application/connect+json";
const encodingProto = "proto";
const encodingJson = "json";
/**
 * Parse a Connect Content-Type header.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function parseContentType(contentType) {
    const match = contentType === null || contentType === void 0 ? void 0 : contentType.match(exports.contentTypeRegExp);
    if (!match) {
        return undefined;
    }
    const stream = !!match[1];
    const binary = !!match[3];
    return { stream, binary };
}
/**
 * Parse a Connect Get encoding query parameter.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function parseEncodingQuery(encoding) {
    switch (encoding) {
        case encodingProto:
            return { stream: false, binary: true };
        case encodingJson:
            return { stream: false, binary: false };
        default:
            return undefined;
    }
}
