/*! @azure/msal-common v15.14.1 2026-01-17 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isCloudInstanceDiscoveryResponse(response) {
    return (response.hasOwnProperty("tenant_discovery_endpoint") &&
        response.hasOwnProperty("metadata"));
}

export { isCloudInstanceDiscoveryResponse };
//# sourceMappingURL=CloudInstanceDiscoveryResponse.mjs.map
