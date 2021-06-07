"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class PreconditionFailedError extends http_error_1.default {
    constructor(message) {
        const status = 412;
        const code = 'PRECONDITION_FAILED';
        message = message || 'Precondition Failed';
        super({ code, message, status });
    }
}
exports.default = PreconditionFailedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDEyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDEyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sdUJBQXdCLFNBQVEsb0JBQVM7SUFFN0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcscUJBQXFCLENBQUM7UUFDbkMsT0FBTyxHQUFHLE9BQU8sSUFBSSxxQkFBcUIsQ0FBQztRQUUzQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsdUJBQXVCLENBQUMifQ==