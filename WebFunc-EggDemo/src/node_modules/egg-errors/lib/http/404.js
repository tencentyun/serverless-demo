"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class NotFoundError extends http_error_1.default {
    constructor(message) {
        const status = 404;
        const code = 'NOT_FOUND';
        message = message || 'Not Found';
        super({ code, message, status });
    }
}
exports.default = NotFoundError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sYUFBYyxTQUFRLG9CQUFTO0lBRW5DLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztRQUN6QixPQUFPLEdBQUcsT0FBTyxJQUFJLFdBQVcsQ0FBQztRQUVqQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsYUFBYSxDQUFDIn0=