"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class NotExtendedError extends http_error_1.default {
    constructor(message) {
        const status = 510;
        const code = 'NOT_EXTENDED';
        message = message || 'Not Extended';
        super({ code, message, status });
    }
}
exports.default = NotExtendedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTEwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTEwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZ0JBQWlCLFNBQVEsb0JBQVM7SUFFdEMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDO1FBQzVCLE9BQU8sR0FBRyxPQUFPLElBQUksY0FBYyxDQUFDO1FBRXBDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxnQkFBZ0IsQ0FBQyJ9