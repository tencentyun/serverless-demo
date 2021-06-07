"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UnauthorizedError extends http_error_1.default {
    constructor(message) {
        const status = 401;
        const code = 'UNAUTHORIZED';
        message = message || 'Unauthorized';
        super({ code, message, status });
    }
}
exports.default = UnauthorizedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDAxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDAxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0saUJBQWtCLFNBQVEsb0JBQVM7SUFFdkMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDO1FBQzVCLE9BQU8sR0FBRyxPQUFPLElBQUksY0FBYyxDQUFDO1FBRXBDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQyJ9