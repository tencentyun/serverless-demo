"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
/* eslint-disable */
var channel_buf_1 = __importDefault(require("../channel-buf"));
var neo4j_driver_core_1 = require("neo4j-driver-core");
var conversion_ts_1 = require("https://deno.land/std@0.157.0/streams/conversion.ts");
var _a = neo4j_driver_core_1.internal.util, ENCRYPTION_OFF = _a.ENCRYPTION_OFF, ENCRYPTION_ON = _a.ENCRYPTION_ON;
var _CONNECTION_IDGEN = 0;
/**
 * Create a new DenoChannel to be used in Deno runtime.
 * @access private
 */
var DenoChannel = /** @class */ (function () {
    /**
     * Create new instance
     * @param {ChannelConfig} config - configuration for this channel.
     */
    function DenoChannel(config, connect) {
        if (connect === void 0) { connect = _connect; }
        var _this = this;
        this.id = _CONNECTION_IDGEN++;
        this._conn = null;
        this._pending = [];
        this._open = true;
        this._error = null;
        this._handleConnectionError = this._handleConnectionError.bind(this);
        this._handleConnectionTerminated = this._handleConnectionTerminated.bind(this);
        this._connectionErrorCode = config.connectionErrorCode;
        this._receiveTimeout = null;
        this._receiveTimeoutStarted = false;
        this._receiveTimeoutId = null;
        this._config = config;
        connect(config)
            .then(function (conn) {
            _this._clearConnectionTimeout();
            if (!_this._open) {
                return conn.close();
            }
            _this._conn = conn;
            setupReader(_this)
                .catch(_this._handleConnectionError);
            var pending = _this._pending;
            _this._pending = null;
            for (var i = 0; i < pending.length; i++) {
                _this.write(pending[i]);
            }
        })
            .catch(this._handleConnectionError);
        this._connectionTimeoutFired = false;
        this._connectionTimeoutId = this._setupConnectionTimeout();
    }
    DenoChannel.prototype._setupConnectionTimeout = function () {
        var _this = this;
        var timeout = this._config.connectionTimeout;
        if (timeout) {
            return setTimeout(function () {
                _this._connectionTimeoutFired = true;
                _this.close()
                    .then(function (e) { return _this._handleConnectionError((0, neo4j_driver_core_1.newError)("Connection timeout after ".concat(timeout, " ms"))); })
                    .catch(_this._handleConnectionError);
            }, timeout);
        }
        return null;
    };
    /**
     * Remove active connection timeout, if any.
     * @private
     */
    DenoChannel.prototype._clearConnectionTimeout = function () {
        var timeoutId = this._connectionTimeoutId;
        if (timeoutId !== null) {
            this._connectionTimeoutFired = false;
            this._connectionTimeoutId = null;
            clearTimeout(timeoutId);
        }
    };
    DenoChannel.prototype._handleConnectionError = function (err) {
        var msg = 'Failed to connect to server. ' +
            'Please ensure that your database is listening on the correct host and port ' +
            'and that you have compatible encryption settings both on Neo4j server and driver. ' +
            'Note that the default encryption setting has changed in Neo4j 4.0.';
        if (err.message)
            msg += ' Caused by: ' + err.message;
        this._error = (0, neo4j_driver_core_1.newError)(msg, this._connectionErrorCode);
        if (this.onerror) {
            this.onerror(this._error);
        }
    };
    DenoChannel.prototype._handleConnectionTerminated = function () {
        this._open = false;
        this._error = (0, neo4j_driver_core_1.newError)('Connection was closed by server', this._connectionErrorCode);
        if (this.onerror) {
            this.onerror(this._error);
        }
    };
    /**
     * Write the passed in buffer to connection
     * @param {ChannelBuffer} buffer - Buffer to write
     */
    DenoChannel.prototype.write = function (buffer) {
        if (this._pending !== null) {
            this._pending.push(buffer);
        }
        else if (buffer instanceof channel_buf_1.default) {
            this._conn.write(buffer._buffer).catch(this._handleConnectionError);
        }
        else {
            throw (0, neo4j_driver_core_1.newError)("Don't know how to send buffer: " + buffer);
        }
    };
    /**
     * Close the connection
     * @returns {Promise} A promise that will be resolved after channel is closed
     */
    DenoChannel.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._open) return [3 /*break*/, 2];
                        this._open = false;
                        this.stopReceiveTimeout();
                        if (!(this._conn != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._conn.close()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup the receive timeout for the channel.
     *
     * Not supported for the browser channel.
     *
     * @param {number} receiveTimeout The amount of time the channel will keep without receive any data before timeout (ms)
     * @returns {void}
     */
    DenoChannel.prototype.setupReceiveTimeout = function (receiveTimeout) {
        this._receiveTimeout = receiveTimeout;
    };
    /**
     * Stops the receive timeout for the channel.
     */
    DenoChannel.prototype.stopReceiveTimeout = function () {
        if (this._receiveTimeout !== null && this._receiveTimeoutStarted) {
            this._receiveTimeoutStarted = false;
            if (this._receiveTimeoutId != null) {
                clearTimeout(this._receiveTimeoutId);
            }
            this._receiveTimeoutId = null;
        }
    };
    /**
     * Start the receive timeout for the channel.
     */
    DenoChannel.prototype.startReceiveTimeout = function () {
        if (this._open && this._receiveTimeout !== null && !this._receiveTimeoutStarted) {
            this._receiveTimeoutStarted = true;
            this._resetTimeout();
        }
    };
    DenoChannel.prototype._resetTimeout = function () {
        var _this = this;
        if (!this._receiveTimeoutStarted) {
            return;
        }
        if (this._receiveTimeoutId !== null) {
            clearTimeout(this._receiveTimeoutId);
        }
        this._receiveTimeoutId = setTimeout(function () {
            _this._receiveTimeoutId = null;
            _this.stopReceiveTimeout();
            _this._error = (0, neo4j_driver_core_1.newError)("Connection lost. Server didn't respond in ".concat(_this._receiveTimeout, "ms"), _this._config.connectionErrorCode);
            _this.close()
                .catch(function () {
                // ignoring error during the close timeout connections since they
                // not valid 
            })
                .finally(function () {
                if (_this.onerror) {
                    _this.onerror(_this._error);
                }
            });
        }, this._receiveTimeout);
    };
    return DenoChannel;
}());
exports.default = DenoChannel;
var TrustStrategy = {
    TRUST_CUSTOM_CA_SIGNED_CERTIFICATES: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var caCerts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.trustedCertificates ||
                            config.trustedCertificates.length === 0) {
                            throw (0, neo4j_driver_core_1.newError)('You are using TRUST_CUSTOM_CA_SIGNED_CERTIFICATES as the method ' +
                                'to verify trust for encrypted  connections, but have not configured any ' +
                                'trustedCertificates. You  must specify the path to at least one trusted ' +
                                'X.509 certificate for this to work. Two other alternatives is to use ' +
                                'TRUST_ALL_CERTIFICATES or to disable encryption by setting encrypted="' +
                                ENCRYPTION_OFF +
                                '"' +
                                'in your driver configuration.');
                        }
                        assertNotClientCertificates(config);
                        return [4 /*yield*/, Promise.all(config.trustedCertificates.map(function (f) { return Deno.readTextFile(f); }))];
                    case 1:
                        caCerts = _a.sent();
                        return [2 /*return*/, Deno.connectTls({
                                hostname: config.address.resolvedHost(),
                                port: config.address.port(),
                                caCerts: caCerts
                            })];
                }
            });
        });
    },
    TRUST_SYSTEM_CA_SIGNED_CERTIFICATES: function (config) {
        assertNotClientCertificates(config);
        return Deno.connectTls({
            hostname: config.address.resolvedHost(),
            port: config.address.port()
        });
    },
    TRUST_ALL_CERTIFICATES: function (config) {
        throw (0, neo4j_driver_core_1.newError)("\"".concat(config.trust, "\" is not available in DenoJS. ") +
            'For trust in any certificates, you should use the DenoJS flag ' +
            '"--unsafely-ignore-certificate-errors". ' +
            'See, https://deno.com/blog/v1.13#disable-tls-verification');
    }
};
function assertNotClientCertificates(config) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (config.clientCertificate != null) {
                throw (0, neo4j_driver_core_1.newError)('clientCertificates are not supported in DenoJS since the API does not ' +
                    'support its configuration. See, https://deno.land/api@v1.29.0?s=Deno.ConnectTlsOptions.');
            }
            return [2 /*return*/];
        });
    });
}
function _connect(config) {
    return __awaiter(this, void 0, void 0, function () {
        var trustStrategyName, trustStrategy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isEncrypted(config)) {
                        return [2 /*return*/, Deno.connect({
                                hostname: config.address.resolvedHost(),
                                port: config.address.port()
                            })];
                    }
                    trustStrategyName = getTrustStrategyName(config);
                    trustStrategy = TrustStrategy[trustStrategyName];
                    if (!(trustStrategy != null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, trustStrategy(config)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: throw (0, neo4j_driver_core_1.newError)('Unknown trust strategy: ' +
                    config.trust +
                    '. Please use either ' +
                    "trust:'TRUST_CUSTOM_CA_SIGNED_CERTIFICATES' configuration " +
                    'or the System CA. ' +
                    'Alternatively, you can disable encryption by setting ' +
                    '`encrypted:"' +
                    ENCRYPTION_OFF +
                    '"`. There is no mechanism to use encryption without trust verification, ' +
                    'because this incurs the overhead of encryption without improving security. If ' +
                    'the driver does not verify that the peer it is connected to is really Neo4j, it ' +
                    'is very easy for an attacker to bypass the encryption by pretending to be Neo4j.');
            }
        });
    });
}
function isEncrypted(config) {
    var encryptionNotConfigured = config.encrypted == null || config.encrypted === undefined;
    if (encryptionNotConfigured) {
        // default to using encryption if trust-all-certificates is available
        return false;
    }
    return config.encrypted === true || config.encrypted === ENCRYPTION_ON;
}
function getTrustStrategyName(config) {
    if (config.trust) {
        return config.trust;
    }
    return 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES';
}
function setupReader(channel) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var _d, _e, _f, message, e_1_1, error_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 13, , 14]);
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 6, 7, 12]);
                    _d = true, _e = __asyncValues((0, conversion_ts_1.iterateReader)(channel._conn));
                    _g.label = 2;
                case 2: return [4 /*yield*/, _e.next()];
                case 3:
                    if (!(_f = _g.sent(), _a = _f.done, !_a)) return [3 /*break*/, 5];
                    _c = _f.value;
                    _d = false;
                    try {
                        message = _c;
                        channel._resetTimeout();
                        if (!channel._open) {
                            return [2 /*return*/];
                        }
                        if (channel.onmessage) {
                            channel.onmessage(new channel_buf_1.default(message));
                        }
                    }
                    finally {
                        _d = true;
                    }
                    _g.label = 4;
                case 4: return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_1_1 = _g.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _g.trys.push([7, , 10, 11]);
                    if (!(!_d && !_a && (_b = _e.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _b.call(_e)];
                case 8:
                    _g.sent();
                    _g.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    channel._handleConnectionTerminated();
                    return [3 /*break*/, 14];
                case 13:
                    error_1 = _g.sent();
                    if (channel._open) {
                        channel._handleConnectionError(error_1);
                    }
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
