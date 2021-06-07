"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class HTTPVersionNotSupportedError extends http_error_1.default {
    constructor(message) {
        const status = 505;
        const code = 'HTTP_VERSION_NOT_SUPPORTED';
        message = message || 'HTTP Version Not Supported';
        super({ code, message, status });
    }
}
exports.default = HTTPVersionNotSupportedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTA1LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTA1LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sNEJBQTZCLFNBQVEsb0JBQVM7SUFFbEQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsNEJBQTRCLENBQUM7UUFDMUMsT0FBTyxHQUFHLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQztRQUVsRCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsNEJBQTRCLENBQUMifQ==