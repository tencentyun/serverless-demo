"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class PreconditionRequiredError extends http_error_1.default {
    constructor(message) {
        const status = 428;
        const code = 'PRECONDITION_REQUIRED';
        message = message || 'Precondition Required';
        super({ code, message, status });
    }
}
exports.default = PreconditionRequiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDI4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDI4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0seUJBQTBCLFNBQVEsb0JBQVM7SUFFL0MsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsdUJBQXVCLENBQUM7UUFDckMsT0FBTyxHQUFHLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQztRQUU3QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUseUJBQXlCLENBQUMifQ==