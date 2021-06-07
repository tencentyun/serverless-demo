"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionsZone = void 0;
const exception_handler_1 = require("./exception-handler");
const DEFAULT_TEARDOWN = () => process.exit(1);
class ExceptionsZone {
    static run(callback, teardown = DEFAULT_TEARDOWN) {
        try {
            callback();
        }
        catch (e) {
            this.exceptionHandler.handle(e);
            teardown(e);
        }
    }
    static async asyncRun(callback, teardown = DEFAULT_TEARDOWN) {
        try {
            await callback();
        }
        catch (e) {
            this.exceptionHandler.handle(e);
            teardown(e);
        }
    }
}
exports.ExceptionsZone = ExceptionsZone;
ExceptionsZone.exceptionHandler = new exception_handler_1.ExceptionHandler();
