"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class FailedDependencyError extends http_error_1.default {
    constructor(message) {
        const status = 424;
        const code = 'FAILED_DEPENDENCY';
        message = message || 'Failed Dependency';
        super({ code, message, status });
    }
}
exports.default = FailedDependencyError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDI0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDI0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0scUJBQXNCLFNBQVEsb0JBQVM7SUFFM0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7UUFDakMsT0FBTyxHQUFHLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQztRQUV6QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUscUJBQXFCLENBQUMifQ==