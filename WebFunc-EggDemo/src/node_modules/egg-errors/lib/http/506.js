"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class VariantAlsoNegotiatesError extends http_error_1.default {
    constructor(message) {
        const status = 506;
        const code = 'VARIANT_ALSO_NEGOTIATES';
        message = message || 'Variant Also Negotiates';
        super({ code, message, status });
    }
}
exports.default = VariantAlsoNegotiatesError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTA2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTA2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sMEJBQTJCLFNBQVEsb0JBQVM7SUFFaEQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcseUJBQXlCLENBQUM7UUFDdkMsT0FBTyxHQUFHLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQztRQUUvQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsMEJBQTBCLENBQUMifQ==