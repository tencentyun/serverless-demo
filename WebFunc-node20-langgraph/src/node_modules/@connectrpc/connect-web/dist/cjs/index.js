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
exports.createGrpcWebTransport = exports.createConnectTransport = void 0;
var connect_transport_js_1 = require("./connect-transport.js");
Object.defineProperty(exports, "createConnectTransport", { enumerable: true, get: function () { return connect_transport_js_1.createConnectTransport; } });
var grpc_web_transport_js_1 = require("./grpc-web-transport.js");
Object.defineProperty(exports, "createGrpcWebTransport", { enumerable: true, get: function () { return grpc_web_transport_js_1.createGrpcWebTransport; } });
