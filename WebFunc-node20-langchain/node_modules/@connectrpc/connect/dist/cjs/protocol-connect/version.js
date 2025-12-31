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
exports.protocolVersion = void 0;
exports.requireProtocolVersionHeader = requireProtocolVersionHeader;
exports.requireProtocolVersionParam = requireProtocolVersionParam;
const headers_js_1 = require("./headers.js");
const query_params_js_1 = require("./query-params.js");
const connect_error_js_1 = require("../connect-error.js");
const code_js_1 = require("../code.js");
/**
 * The only know value for the header Connect-Protocol-Version.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.protocolVersion = "1";
/**
 * Requires the Connect-Protocol-Version header to be present with the expected
 * value. Raises a ConnectError with Code.InvalidArgument otherwise.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requireProtocolVersionHeader(requestHeader) {
    const v = requestHeader.get(headers_js_1.headerProtocolVersion);
    if (v === null) {
        throw new connect_error_js_1.ConnectError(`missing required header: set ${headers_js_1.headerProtocolVersion} to "${exports.protocolVersion}"`, code_js_1.Code.InvalidArgument);
    }
    else if (v !== exports.protocolVersion) {
        throw new connect_error_js_1.ConnectError(`${headers_js_1.headerProtocolVersion} must be "${exports.protocolVersion}": got "${v}"`, code_js_1.Code.InvalidArgument);
    }
}
/**
 * Requires the connect query parameter to be present with the expected value.
 * Raises a ConnectError with Code.InvalidArgument otherwise.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requireProtocolVersionParam(queryParams) {
    const v = queryParams.get(query_params_js_1.paramConnectVersion);
    if (v === null) {
        throw new connect_error_js_1.ConnectError(`missing required parameter: set ${query_params_js_1.paramConnectVersion} to "v${exports.protocolVersion}"`, code_js_1.Code.InvalidArgument);
    }
    else if (v !== `v${exports.protocolVersion}`) {
        throw new connect_error_js_1.ConnectError(`${query_params_js_1.paramConnectVersion} must be "v${exports.protocolVersion}": got "${v}"`, code_js_1.Code.InvalidArgument);
    }
}
