"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ServiceUnavailableError extends http_error_1.default {
    constructor(message) {
        const status = 503;
        const code = 'SERVICE_UNAVAILABLE';
        message = message || 'Service Unavailable';
        super({ code, message, status });
    }
}
exports.default = ServiceUnavailableError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTAzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTAzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sdUJBQXdCLFNBQVEsb0JBQVM7SUFFN0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcscUJBQXFCLENBQUM7UUFDbkMsT0FBTyxHQUFHLE9BQU8sSUFBSSxxQkFBcUIsQ0FBQztRQUUzQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsdUJBQXVCLENBQUMifQ==