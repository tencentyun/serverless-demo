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
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDefaultTracerProviderConfiguration = void 0;
function initializeDefaultTracerProviderConfiguration() {
    return {
        processors: [],
        limits: {
            attribute_count_limit: 128,
            event_count_limit: 128,
            link_count_limit: 128,
            event_attribute_count_limit: 128,
            link_attribute_count_limit: 128,
        },
        sampler: {
            parent_based: {
                root: { always_on: undefined },
                remote_parent_sampled: { always_on: undefined },
                remote_parent_not_sampled: { always_off: undefined },
                local_parent_sampled: { always_on: undefined },
                local_parent_not_sampled: { always_off: undefined },
            },
        },
    };
}
exports.initializeDefaultTracerProviderConfiguration = initializeDefaultTracerProviderConfiguration;
//# sourceMappingURL=tracerProviderModel.js.map