"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNodeSDK = void 0;
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
const configuration_1 = require("@opentelemetry/configuration");
const api_1 = require("@opentelemetry/api");
const utils_1 = require("./utils");
const instrumentation_1 = require("@opentelemetry/instrumentation");
/**
 * @experimental Function to start the OpenTelemetry Node SDK
 * @param sdkOptions
 */
function startNodeSDK(sdkOptions) {
    const configFactory = (0, configuration_1.createConfigFactory)();
    const config = configFactory.getConfigModel();
    if (config.disabled) {
        api_1.diag.info('OpenTelemetry SDK is disabled');
        return NOOP_SDK;
    }
    if (config.log_level != null) {
        api_1.diag.setLogger(new api_1.DiagConsoleLogger(), { logLevel: config.log_level });
    }
    (0, instrumentation_1.registerInstrumentations)({
        instrumentations: sdkOptions?.instrumentations?.flat() ?? [],
    });
    (0, utils_1.setupDefaultContextManager)();
    (0, utils_1.setupPropagator)(sdkOptions?.textMapPropagator === null
        ? null // null means don't set.
        : (sdkOptions?.textMapPropagator ??
            (0, utils_1.getPropagatorFromConfiguration)(config)));
    const shutdownFn = async () => {
        const promises = [];
        await Promise.all(promises);
    };
    return { shutdown: shutdownFn };
}
exports.startNodeSDK = startNodeSDK;
const NOOP_SDK = {
    shutdown: async () => { },
};
//# sourceMappingURL=start.js.map