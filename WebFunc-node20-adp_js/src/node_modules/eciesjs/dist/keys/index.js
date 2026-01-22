"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKey = exports.PrivateKey = void 0;
// treat Buffer as Uint8array, i.e. no call of Buffer specific functions
// finally Uint8Array only
var PrivateKey_1 = require("./PrivateKey");
Object.defineProperty(exports, "PrivateKey", { enumerable: true, get: function () { return PrivateKey_1.PrivateKey; } });
var PublicKey_1 = require("./PublicKey");
Object.defineProperty(exports, "PublicKey", { enumerable: true, get: function () { return PublicKey_1.PublicKey; } });
