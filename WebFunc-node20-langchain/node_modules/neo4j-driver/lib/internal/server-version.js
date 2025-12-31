"use strict";
/**
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [https://neo4j.com]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION_IN_DEV = exports.VERSION_4_0_0 = exports.VERSION_3_5_0 = exports.VERSION_3_4_0 = exports.VERSION_3_2_0 = exports.ServerVersion = void 0;
var neo4j_driver_core_1 = require("neo4j-driver-core");
var assertString = neo4j_driver_core_1.internal.util.assertString;
var SERVER_VERSION_REGEX = /^(Neo4j\/)?(\d+)\.(\d+)(?:\.)?(\d*)(\.|-|\+)?([0-9A-Za-z-.]*)?$/;
var NEO4J_IN_DEV_VERSION_STRING = 'Neo4j/dev';
var ServerVersion = /** @class */ (function () {
    /**
     * @constructor
     * @param {number} major the major version number.
     * @param {number} minor the minor version number.
     * @param {number} patch the patch version number.
     * @param {string} [originalVersionString] the original version string
     */
    function ServerVersion(major, minor, patch, originalVersionString) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this._originalVersionString = originalVersionString;
    }
    /**
     * Fetch server version using the given driver.
     * @param {Driver} driver the driver to use.
     * @return {Promise<ServerVersion>} promise resolved with a {@link ServerVersion} object or rejected with error.
     */
    ServerVersion.fromDriver = function (driver) {
        var session = driver.session();
        return session
            .run('RETURN 1')
            .then(function (result) {
            return session
                .close()
                .then(function () { return ServerVersion.fromString(result.summary.server.version); });
        });
    };
    /**
     * Parse given string to a {@link ServerVersion} object.
     * @param {string} versionStr the string to parse.
     * @return {ServerVersion} version for the given string.
     * @throws Error if given string can't be parsed.
     */
    ServerVersion.fromString = function (versionStr) {
        if (!versionStr) {
            return new ServerVersion(3, 0, 0);
        }
        assertString(versionStr, 'Neo4j version string');
        if (versionStr.toLowerCase() === NEO4J_IN_DEV_VERSION_STRING.toLowerCase()) {
            return VERSION_IN_DEV;
        }
        var version = versionStr.match(SERVER_VERSION_REGEX);
        if (!version) {
            throw new Error("Unparsable Neo4j version: ".concat(versionStr));
        }
        var major = parseIntStrict(version[2]);
        var minor = parseIntStrict(version[3]);
        var patch = parseIntStrict(version[4] || 0);
        return new ServerVersion(major, minor, patch, versionStr);
    };
    /**
     * Compare this version to the given one.
     * @param {ServerVersion} other the version to compare with.
     * @return {number} value 0 if this version is the same as the given one, value less then 0 when this version
     * was released earlier than the given one and value greater then 0 when this version was released after
     * than the given one.
     */
    ServerVersion.prototype.compareTo = function (other) {
        var result = compareInts(this.major, other.major);
        if (result === 0) {
            result = compareInts(this.minor, other.minor);
            if (result === 0) {
                result = compareInts(this.patch, other.patch);
            }
        }
        return result;
    };
    ServerVersion.prototype.toString = function () {
        if (this._originalVersionString) {
            return this._originalVersionString;
        }
        return "".concat(this.major, ".").concat(this.minor, ".").concat(this.patch);
    };
    return ServerVersion;
}());
exports.ServerVersion = ServerVersion;
function parseIntStrict(str, name) {
    var value = parseInt(str, 10);
    if (!value && value !== 0) {
        throw new Error("Unparsable number ".concat(name, ": '").concat(str, "'"));
    }
    return value;
}
function compareInts(x, y) {
    return x < y ? -1 : x === y ? 0 : 1;
}
var VERSION_3_2_0 = ServerVersion.fromString('Neo4j/3.2.0');
exports.VERSION_3_2_0 = VERSION_3_2_0;
var VERSION_3_4_0 = ServerVersion.fromString('Neo4j/3.4.0');
exports.VERSION_3_4_0 = VERSION_3_4_0;
var VERSION_3_5_0 = ServerVersion.fromString('Neo4j/3.5.0');
exports.VERSION_3_5_0 = VERSION_3_5_0;
var VERSION_4_0_0 = ServerVersion.fromString('Neo4j/4.0.0');
exports.VERSION_4_0_0 = VERSION_4_0_0;
var maxVer = Number.MAX_SAFE_INTEGER;
var VERSION_IN_DEV = new ServerVersion(maxVer, maxVer, maxVer, NEO4J_IN_DEV_VERSION_STRING);
exports.VERSION_IN_DEV = VERSION_IN_DEV;