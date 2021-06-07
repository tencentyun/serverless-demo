"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class LengthRequiredError extends http_error_1.default {
    constructor(message) {
        const status = 411;
        const code = 'LENGTH_REQUIRED';
        message = message || 'Length Required';
        super({ code, message, status });
    }
}
exports.default = LengthRequiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDExLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDExLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sbUJBQW9CLFNBQVEsb0JBQVM7SUFFekMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsaUJBQWlCLENBQUM7UUFDL0IsT0FBTyxHQUFHLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQztRQUV2QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsbUJBQW1CLENBQUMifQ==