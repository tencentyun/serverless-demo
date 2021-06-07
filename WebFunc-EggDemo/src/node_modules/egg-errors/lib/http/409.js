"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ConflictError extends http_error_1.default {
    constructor(message) {
        const status = 409;
        const code = 'CONFLICT';
        message = message || 'Conflict';
        super({ code, message, status });
    }
}
exports.default = ConflictError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sYUFBYyxTQUFRLG9CQUFTO0lBRW5DLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQztRQUN4QixPQUFPLEdBQUcsT0FBTyxJQUFJLFVBQVUsQ0FBQztRQUVoQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsYUFBYSxDQUFDIn0=