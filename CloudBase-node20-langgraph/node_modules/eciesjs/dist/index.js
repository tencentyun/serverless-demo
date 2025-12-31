"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.PublicKey = exports.PrivateKey = exports.ECIES_CONFIG = void 0;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
var utils_1 = require("@noble/ciphers/utils");
var config_1 = require("./config");
var keys_1 = require("./keys");
var utils_2 = require("./utils");
/**
 * Encrypts data with a receiver's public key.
 * @description From version 0.5.0, `Uint8Array` will be returned instead of `Buffer`.
 * To keep the same behavior, use `Buffer.from(encrypt(...))`.
 *
 * @param receiverRawPK - Raw public key of the receiver, either as a hex `string` or a `Uint8Array`.
 * @param data - Data to encrypt.
 * @returns Encrypted payload, format: `public key || encrypted`.
 */
function encrypt(receiverRawPK, data) {
    return Buffer.from(_encrypt(receiverRawPK, data));
}
function _encrypt(receiverRawPK, data) {
    var curve = (0, config_1.ellipticCurve)();
    var ephemeralSK = new keys_1.PrivateKey(undefined, curve);
    var receiverPK = receiverRawPK instanceof Uint8Array
        ? new keys_1.PublicKey(receiverRawPK, curve)
        : keys_1.PublicKey.fromHex(receiverRawPK, curve);
    var sharedKey = ephemeralSK.encapsulate(receiverPK, (0, config_1.isHkdfKeyCompressed)());
    var ephemeralPK = ephemeralSK.publicKey.toBytes((0, config_1.isEphemeralKeyCompressed)());
    var encrypted = (0, utils_2.symEncrypt)(sharedKey, data);
    return (0, utils_1.concatBytes)(ephemeralPK, encrypted);
}
/**
 * Decrypts data with a receiver's private key.
 * @description From version 0.5.0, `Uint8Array` will be returned instead of `Buffer`.
 * To keep the same behavior, use `Buffer.from(decrypt(...))`.
 *
 * @param receiverRawSK - Raw private key of the receiver, either as a hex `string` or a `Uint8Array`.
 * @param data - Data to decrypt.
 * @returns Decrypted plain text.
 */
function decrypt(receiverRawSK, data) {
    return Buffer.from(_decrypt(receiverRawSK, data));
}
function _decrypt(receiverRawSK, data) {
    var curve = (0, config_1.ellipticCurve)();
    var receiverSK = receiverRawSK instanceof Uint8Array
        ? new keys_1.PrivateKey(receiverRawSK, curve)
        : keys_1.PrivateKey.fromHex(receiverRawSK, curve);
    var keySize = (0, config_1.ephemeralKeySize)();
    var ephemeralPK = new keys_1.PublicKey(data.subarray(0, keySize), curve);
    var encrypted = data.subarray(keySize);
    var sharedKey = ephemeralPK.decapsulate(receiverSK, (0, config_1.isHkdfKeyCompressed)());
    return (0, utils_2.symDecrypt)(sharedKey, encrypted);
}
var config_2 = require("./config");
Object.defineProperty(exports, "ECIES_CONFIG", { enumerable: true, get: function () { return config_2.ECIES_CONFIG; } });
var keys_2 = require("./keys");
Object.defineProperty(exports, "PrivateKey", { enumerable: true, get: function () { return keys_2.PrivateKey; } });
Object.defineProperty(exports, "PublicKey", { enumerable: true, get: function () { return keys_2.PublicKey; } });
/** @deprecated - use `import utils from "eciesjs/utils"` instead. */
exports.utils = {
    // TODO: remove these after 0.5.0
    aesEncrypt: utils_2.aesEncrypt,
    aesDecrypt: utils_2.aesDecrypt,
    symEncrypt: utils_2.symEncrypt,
    symDecrypt: utils_2.symDecrypt,
    decodeHex: utils_2.decodeHex,
    getValidSecret: utils_2.getValidSecret,
    remove0x: utils_2.remove0x,
};
