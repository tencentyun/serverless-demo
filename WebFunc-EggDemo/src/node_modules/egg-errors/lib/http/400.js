"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class BadRequestError extends http_error_1.default {
    constructor(message) {
        const status = 400;
        const code = 'BAD_REQUEST';
        message = message || 'Bad Request';
        super({ code, message, status });
    }
}
exports.default = BadRequestError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDAwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDAwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZUFBZ0IsU0FBUSxvQkFBUztJQUVyQyxZQUFZLE9BQWdCO1FBQzFCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNuQixNQUFNLElBQUksR0FBRyxhQUFhLENBQUM7UUFDM0IsT0FBTyxHQUFHLE9BQU8sSUFBSSxhQUFhLENBQUM7UUFFbkMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRjtBQUVELGtCQUFlLGVBQWUsQ0FBQyJ9