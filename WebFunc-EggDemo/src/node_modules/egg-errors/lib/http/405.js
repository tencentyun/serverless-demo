"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class MethodNotAllowedError extends http_error_1.default {
    constructor(message) {
        const status = 405;
        const code = 'METHOD_NOT_ALLOWED';
        message = message || 'Method Not Allowed';
        super({ code, message, status });
    }
}
exports.default = MethodNotAllowedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA1LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA1LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0scUJBQXNCLFNBQVEsb0JBQVM7SUFFM0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUM7UUFDbEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQztRQUUxQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUscUJBQXFCLENBQUMifQ==