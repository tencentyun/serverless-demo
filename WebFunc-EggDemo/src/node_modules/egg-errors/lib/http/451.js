"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UnavailableForLegalReasonsError extends http_error_1.default {
    constructor(message) {
        const status = 451;
        const code = 'UNAVAILABLE_FOR_LEGAL_REASONS';
        message = message || 'Unavailable For Legal Reasons';
        super({ code, message, status });
    }
}
exports.default = UnavailableForLegalReasonsError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDUxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDUxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sK0JBQWdDLFNBQVEsb0JBQVM7SUFFckQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsK0JBQStCLENBQUM7UUFDN0MsT0FBTyxHQUFHLE9BQU8sSUFBSSwrQkFBK0IsQ0FBQztRQUVyRCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsK0JBQStCLENBQUMifQ==