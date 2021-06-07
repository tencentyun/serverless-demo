"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class MisdirectedRequestError extends http_error_1.default {
    constructor(message) {
        const status = 421;
        const code = 'MISDIRECTED_REQUEST';
        message = message || 'Misdirected Request';
        super({ code, message, status });
    }
}
exports.default = MisdirectedRequestError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDIxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDIxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sdUJBQXdCLFNBQVEsb0JBQVM7SUFFN0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcscUJBQXFCLENBQUM7UUFDbkMsT0FBTyxHQUFHLE9BQU8sSUFBSSxxQkFBcUIsQ0FBQztRQUUzQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsdUJBQXVCLENBQUMifQ==