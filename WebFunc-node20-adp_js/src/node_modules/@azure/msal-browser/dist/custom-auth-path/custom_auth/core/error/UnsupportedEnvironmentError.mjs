/*! @azure/msal-browser v4.28.1 2026-01-17 */
'use strict';
import { CustomAuthError } from './CustomAuthError.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class UnsupportedEnvironmentError extends CustomAuthError {
    constructor(correlationId) {
        super("unsupported_env", "The current environment is not browser", correlationId);
        Object.setPrototypeOf(this, UnsupportedEnvironmentError.prototype);
    }
}

export { UnsupportedEnvironmentError };
//# sourceMappingURL=UnsupportedEnvironmentError.mjs.map
