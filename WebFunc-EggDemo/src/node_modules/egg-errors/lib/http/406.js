"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class NotAcceptableError extends http_error_1.default {
    constructor(message) {
        const status = 406;
        const code = 'NOT_ACCEPTABLE';
        message = message || 'Not Acceptable';
        super({ code, message, status });
    }
}
exports.default = NotAcceptableError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sa0JBQW1CLFNBQVEsb0JBQVM7SUFFeEMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7UUFDOUIsT0FBTyxHQUFHLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQztRQUV0QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMifQ==