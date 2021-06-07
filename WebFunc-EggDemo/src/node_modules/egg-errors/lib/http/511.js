"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class NetworkAuthenticationRequiredError extends http_error_1.default {
    constructor(message) {
        const status = 511;
        const code = 'NETWORK_AUTHENTICATION_REQUIRED';
        message = message || 'Network Authentication Required';
        super({ code, message, status });
    }
}
exports.default = NetworkAuthenticationRequiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTExLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTExLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sa0NBQW1DLFNBQVEsb0JBQVM7SUFFeEQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsaUNBQWlDLENBQUM7UUFDL0MsT0FBTyxHQUFHLE9BQU8sSUFBSSxpQ0FBaUMsQ0FBQztRQUV2RCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsa0NBQWtDLENBQUMifQ==