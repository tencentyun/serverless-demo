"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstrumentationScopeKey = void 0;
/**
 * Converting the instrumentation scope object to a unique identifier string.
 * @param scope - The instrumentation scope to convert
 * @returns A unique string identifier for the scope
 */
function getInstrumentationScopeKey(scope) {
    return `${scope.name}@${scope.version || ''}:${scope.schemaUrl || ''}`;
}
exports.getInstrumentationScopeKey = getInstrumentationScopeKey;
//# sourceMappingURL=utils.js.map