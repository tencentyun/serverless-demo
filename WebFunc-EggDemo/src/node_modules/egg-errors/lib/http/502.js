"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class BadGatewayError extends http_error_1.default {
    constructor(message) {
        const status = 502;
        const code = 'BAD_GATEWAY';
        message = message || 'Bad Gateway';
        super({ code, message, status });
    }
}
exports.default = BadGatewayError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTAyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTAyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZUFBZ0IsU0FBUSxvQkFBUztJQUVyQyxZQUFZLE9BQWdCO1FBQzFCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNuQixNQUFNLElBQUksR0FBRyxhQUFhLENBQUM7UUFDM0IsT0FBTyxHQUFHLE9BQU8sSUFBSSxhQUFhLENBQUM7UUFFbkMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRjtBQUVELGtCQUFlLGVBQWUsQ0FBQyJ9