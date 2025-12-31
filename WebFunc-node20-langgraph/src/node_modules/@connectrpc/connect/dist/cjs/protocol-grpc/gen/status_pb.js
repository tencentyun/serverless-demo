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
exports.StatusSchema = exports.file_status = void 0;
const codegenv1_1 = require("@bufbuild/protobuf/codegenv1");
const wkt_1 = require("@bufbuild/protobuf/wkt");
/**
 * Describes the file status.proto.
 */
exports.file_status = (0, codegenv1_1.fileDesc)("CgxzdGF0dXMucHJvdG8SCmdvb2dsZS5ycGMiTgoGU3RhdHVzEgwKBGNvZGUYASABKAUSDwoHbWVzc2FnZRgCIAEoCRIlCgdkZXRhaWxzGAMgAygLMhQuZ29vZ2xlLnByb3RvYnVmLkFueUJeCg5jb20uZ29vZ2xlLnJwY0ILU3RhdHVzUHJvdG9QAVo3Z29vZ2xlLmdvbGFuZy5vcmcvZ2VucHJvdG8vZ29vZ2xlYXBpcy9ycGMvc3RhdHVzO3N0YXR1c6ICA1JQQ2IGcHJvdG8z", [wkt_1.file_google_protobuf_any]);
/**
 * Describes the message google.rpc.Status.
 * Use `create(StatusSchema)` to create a new message.
 */
exports.StatusSchema = (0, codegenv1_1.messageDesc)(exports.file_status, 0);
