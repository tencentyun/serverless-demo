"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UnsupportedMediaTypeError extends http_error_1.default {
    constructor(message) {
        const status = 415;
        const code = 'UNSUPPORTED_MEDIA_TYPE';
        message = message || 'Unsupported Media Type';
        super({ code, message, status });
    }
}
exports.default = UnsupportedMediaTypeError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDE1LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDE1LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0seUJBQTBCLFNBQVEsb0JBQVM7SUFFL0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsd0JBQXdCLENBQUM7UUFDdEMsT0FBTyxHQUFHLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQztRQUU5QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUseUJBQXlCLENBQUMifQ==