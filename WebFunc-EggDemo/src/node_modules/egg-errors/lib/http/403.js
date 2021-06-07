"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ForbiddenError extends http_error_1.default {
    constructor(message) {
        const status = 403;
        const code = 'FORBIDDEN';
        message = message || 'Forbidden';
        super({ code, message, status });
    }
}
exports.default = ForbiddenError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDAzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDAzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sY0FBZSxTQUFRLG9CQUFTO0lBRXBDLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztRQUN6QixPQUFPLEdBQUcsT0FBTyxJQUFJLFdBQVcsQ0FBQztRQUVqQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsY0FBYyxDQUFDIn0=