"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class TooManyRequestsError extends http_error_1.default {
    constructor(message) {
        const status = 429;
        const code = 'TOO_MANY_REQUESTS';
        message = message || 'Too Many Requests';
        super({ code, message, status });
    }
}
exports.default = TooManyRequestsError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDI5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDI5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sb0JBQXFCLFNBQVEsb0JBQVM7SUFFMUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7UUFDakMsT0FBTyxHQUFHLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQztRQUV6QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsb0JBQW9CLENBQUMifQ==