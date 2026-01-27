/*! @azure/msal-common v15.14.1 2026-01-17 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isCloudInstanceDiscoveryErrorResponse(response) {
    return (response.hasOwnProperty("error") &&
        response.hasOwnProperty("error_description"));
}

export { isCloudInstanceDiscoveryErrorResponse };
//# sourceMappingURL=CloudInstanceDiscoveryErrorResponse.mjs.map
