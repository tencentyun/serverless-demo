"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class GoneError extends http_error_1.default {
    constructor(message) {
        const status = 410;
        const code = 'GONE';
        message = message || 'Gone';
        super({ code, message, status });
    }
}
exports.default = GoneError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDEwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDEwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sU0FBVSxTQUFRLG9CQUFTO0lBRS9CLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNwQixPQUFPLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQztRQUU1QixLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsU0FBUyxDQUFDIn0=