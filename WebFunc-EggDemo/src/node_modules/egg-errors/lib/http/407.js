"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ProxyAuthenticationRequiredError extends http_error_1.default {
    constructor(message) {
        const status = 407;
        const code = 'PROXY_AUTHENTICATION_REQUIRED';
        message = message || 'Proxy Authentication Required';
        super({ code, message, status });
    }
}
exports.default = ProxyAuthenticationRequiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDA3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDA3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sZ0NBQWlDLFNBQVEsb0JBQVM7SUFFdEQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsK0JBQStCLENBQUM7UUFDN0MsT0FBTyxHQUFHLE9BQU8sSUFBSSwrQkFBK0IsQ0FBQztRQUVyRCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsZ0NBQWdDLENBQUMifQ==