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
exports.createContextValues = createContextValues;
exports.createContextKey = createContextKey;
/**
 * createContextValues creates a new ContextValues.
 */
function createContextValues() {
    return {
        get(key) {
            return key.id in this ? this[key.id] : key.defaultValue;
        },
        set(key, value) {
            this[key.id] = value;
            return this;
        },
        delete(key) {
            delete this[key.id];
            return this;
        },
    };
}
/**
 * createContextKey creates a new ContextKey.
 */
function createContextKey(defaultValue, options) {
    return { id: Symbol(options === null || options === void 0 ? void 0 : options.description), defaultValue };
}
