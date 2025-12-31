"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPException = exports.Auth = void 0;
exports.isStudioUser = isStudioUser;
class Auth {
    constructor() {
        /**
         * @internal
         * @ignore
         */
        Object.defineProperty(this, "~handlerCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    authenticate(cb) {
        this["~handlerCache"].authenticate = cb;
        return this;
    }
    on(event, callback) {
        this["~handlerCache"].callbacks ??= {};
        const events = Array.isArray(event) ? event : [event];
        for (const event of events) {
            this["~handlerCache"].callbacks[event] = callback;
        }
        return this;
    }
}
exports.Auth = Auth;
/**
 * Check if the provided user was provided by LangGraph Studio.
 *
 * By default, if you add custom authorization on your resources, this will also apply to interactions made from the Studio.
 * If you want, you can handle logged-in Studio users in a special way.
 *
 * @param user - The user to check
 * @returns True if the user is a studio user, false otherwise
 */
function isStudioUser(user) {
    if ("kind" in user && user.kind === "StudioUser")
        return true;
    return user.identity === "langgraph-studio-user";
}
var error_js_1 = require("./error.cjs");
Object.defineProperty(exports, "HTTPException", { enumerable: true, get: function () { return error_js_1.HTTPException; } });
