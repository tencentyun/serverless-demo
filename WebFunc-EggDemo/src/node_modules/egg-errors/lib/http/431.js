"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class RequestHeaderFieldsTooLargeError extends http_error_1.default {
    constructor(message) {
        const status = 431;
        const code = 'REQUEST_HEADER_FIELDS_TOO_LARGE';
        message = message || 'Request Header Fields Too Large';
        super({ code, message, status });
    }
}
exports.default = RequestHeaderFieldsTooLargeError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDMxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDMxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZ0NBQWlDLFNBQVEsb0JBQVM7SUFFdEQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsaUNBQWlDLENBQUM7UUFDL0MsT0FBTyxHQUFHLE9BQU8sSUFBSSxpQ0FBaUMsQ0FBQztRQUV2RCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsZ0NBQWdDLENBQUMifQ==