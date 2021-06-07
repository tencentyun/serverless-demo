"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class LockedError extends http_error_1.default {
    constructor(message) {
        const status = 423;
        const code = 'LOCKED';
        message = message || 'Locked';
        super({ code, message, status });
    }
}
exports.default = LockedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDIzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDIzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sV0FBWSxTQUFRLG9CQUFTO0lBRWpDLFlBQVksT0FBZ0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQztRQUN0QixPQUFPLEdBQUcsT0FBTyxJQUFJLFFBQVEsQ0FBQztRQUU5QixLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsV0FBVyxDQUFDIn0=