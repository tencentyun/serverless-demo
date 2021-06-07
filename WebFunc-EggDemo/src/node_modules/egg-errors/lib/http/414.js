"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class URITooLongError extends http_error_1.default {
    constructor(message) {
        const status = 414;
        const code = 'URI_TOO_LONG';
        message = message || 'URI Too Long';
        super({ code, message, status });
    }
}
exports.default = URITooLongError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDE0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDE0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZUFBZ0IsU0FBUSxvQkFBUztJQUVyQyxZQUFZLE9BQWdCO1FBQzFCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNuQixNQUFNLElBQUksR0FBRyxjQUFjLENBQUM7UUFDNUIsT0FBTyxHQUFHLE9BQU8sSUFBSSxjQUFjLENBQUM7UUFFcEMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRjtBQUVELGtCQUFlLGVBQWUsQ0FBQyJ9