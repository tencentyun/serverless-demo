"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ImATeapotError extends http_error_1.default {
    constructor(message) {
        const status = 418;
        const code = 'IMA_TEAPOT';
        message = message || 'I\'m a teapot';
        super({ code, message, status });
    }
}
exports.default = ImATeapotError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDE4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDE4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sY0FBZSxTQUFRLG9CQUFTO0lBRXBDLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQztRQUMxQixPQUFPLEdBQUcsT0FBTyxJQUFJLGVBQWUsQ0FBQztRQUVyQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsY0FBYyxDQUFDIn0=