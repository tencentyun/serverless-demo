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
import { fromBinary, toBinary } from "@bufbuild/protobuf";
import { base64Encode, base64Decode } from "@bufbuild/protobuf/wire";
import { ConnectError } from "./connect-error.js";
import { Code } from "./code.js";
export function encodeBinaryHeader(value, desc) {
    let bytes;
    if (desc !== undefined) {
        bytes = toBinary(desc, value);
    }
    else if (typeof value == "string") {
        bytes = new TextEncoder().encode(value);
    }
    else {
        bytes =
            value instanceof Uint8Array
                ? value
                : new Uint8Array(value);
    }
    return base64Encode(bytes, "std_raw");
}
export function decodeBinaryHeader(value, desc, options) {
    try {
        const bytes = base64Decode(value);
        if (desc) {
            return fromBinary(desc, bytes, options);
        }
        return bytes;
    }
    catch (e) {
        throw ConnectError.from(e, Code.DataLoss);
    }
}
/**
 * Merge two or more Headers objects by appending all fields from
 * all inputs to a new Headers object.
 */
export function appendHeaders(...headers) {
    const h = new Headers();
    for (const e of headers) {
        e.forEach((value, key) => {
            h.append(key, value);
        });
    }
    return h;
}
