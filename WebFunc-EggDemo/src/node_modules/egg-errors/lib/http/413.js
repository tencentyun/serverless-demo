"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class PayloadTooLargeError extends http_error_1.default {
    constructor(message) {
        const status = 413;
        const code = 'PAYLOAD_TOO_LARGE';
        message = message || 'Payload Too Large';
        super({ code, message, status });
    }
}
exports.default = PayloadTooLargeError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDEzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDEzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sb0JBQXFCLFNBQVEsb0JBQVM7SUFFMUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7UUFDakMsT0FBTyxHQUFHLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQztRQUV6QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsb0JBQW9CLENBQUMifQ==