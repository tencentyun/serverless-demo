"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseError = void 0;
class CloudBaseError extends Error {
    constructor(message, options = {}) {
        super();
        this.name = 'CloudBaseError';
        const { code = '', action = '', original = null, requestId = '' } = options;
        this.message = action ? `[${action}] ${message}` : message;
        this.original = original;
        this.code = code;
        this.requestId = requestId;
        this.action = action;
    }
}
exports.CloudBaseError = CloudBaseError;
