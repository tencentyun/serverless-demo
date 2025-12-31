"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ephemeralKeySize = exports.symmetricNonceLength = exports.symmetricAlgorithm = exports.isHkdfKeyCompressed = exports.isEphemeralKeyCompressed = exports.ellipticCurve = exports.ECIES_CONFIG = void 0;
var consts_1 = require("./consts");
var Config = /** @class */ (function () {
    function Config() {
        this.ellipticCurve = "secp256k1";
        this.isEphemeralKeyCompressed = false; // secp256k1 only
        this.isHkdfKeyCompressed = false; // secp256k1 only
        this.symmetricAlgorithm = "aes-256-gcm";
        this.symmetricNonceLength = 16; // aes-256-gcm only
    }
    return Config;
}());
exports.ECIES_CONFIG = new Config();
var ellipticCurve = function () { return exports.ECIES_CONFIG.ellipticCurve; };
exports.ellipticCurve = ellipticCurve;
var isEphemeralKeyCompressed = function () { return exports.ECIES_CONFIG.isEphemeralKeyCompressed; };
exports.isEphemeralKeyCompressed = isEphemeralKeyCompressed;
var isHkdfKeyCompressed = function () { return exports.ECIES_CONFIG.isHkdfKeyCompressed; };
exports.isHkdfKeyCompressed = isHkdfKeyCompressed;
var symmetricAlgorithm = function () { return exports.ECIES_CONFIG.symmetricAlgorithm; };
exports.symmetricAlgorithm = symmetricAlgorithm;
var symmetricNonceLength = function () { return exports.ECIES_CONFIG.symmetricNonceLength; };
exports.symmetricNonceLength = symmetricNonceLength;
var ephemeralKeySize = function () {
    var mapping = {
        secp256k1: exports.ECIES_CONFIG.isEphemeralKeyCompressed
            ? consts_1.COMPRESSED_PUBLIC_KEY_SIZE
            : consts_1.UNCOMPRESSED_PUBLIC_KEY_SIZE,
        x25519: consts_1.CURVE25519_PUBLIC_KEY_SIZE,
        ed25519: consts_1.CURVE25519_PUBLIC_KEY_SIZE,
    };
    if (exports.ECIES_CONFIG.ellipticCurve in mapping) {
        return mapping[exports.ECIES_CONFIG.ellipticCurve];
    } /* v8 ignore next 2 */
    else {
        throw new Error("Not implemented");
    }
};
exports.ephemeralKeySize = ephemeralKeySize;
