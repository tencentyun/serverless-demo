"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class RequestTimeoutError extends http_error_1.default {
    constructor(message) {
        const status = 408;
        const code = 'REQUEST_TIMEOUT';
        message = message || 'Request Timeout';
        super({ code, message, status });
    }
}
exports.default = RequestTimeoutError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sbUJBQW9CLFNBQVEsb0JBQVM7SUFFekMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsaUJBQWlCLENBQUM7UUFDL0IsT0FBTyxHQUFHLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQztRQUV2QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsbUJBQW1CLENBQUMifQ==