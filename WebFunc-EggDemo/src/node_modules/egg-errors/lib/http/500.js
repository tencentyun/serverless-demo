"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class InternalServerError extends http_error_1.default {
    constructor(message) {
        const status = 500;
        const code = 'INTERNAL_SERVER_ERROR';
        message = message || 'Internal Server Error';
        super({ code, message, status });
    }
}
exports.default = InternalServerError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTAwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTAwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sbUJBQW9CLFNBQVEsb0JBQVM7SUFFekMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsdUJBQXVCLENBQUM7UUFDckMsT0FBTyxHQUFHLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQztRQUU3QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsbUJBQW1CLENBQUMifQ==