/*! @azure/msal-browser v4.28.1 2026-01-17 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isEncrypted(data) {
    return (data.hasOwnProperty("id") &&
        data.hasOwnProperty("nonce") &&
        data.hasOwnProperty("data"));
}

export { isEncrypted };
//# sourceMappingURL=EncryptedData.mjs.map
