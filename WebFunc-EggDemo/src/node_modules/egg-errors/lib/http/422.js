"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UnprocessableEntityError extends http_error_1.default {
    constructor(message) {
        const status = 422;
        const code = 'UNPROCESSABLE_ENTITY';
        message = message || 'Unprocessable Entity';
        super({ code, message, status });
    }
}
exports.default = UnprocessableEntityError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDIyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDIyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sd0JBQXlCLFNBQVEsb0JBQVM7SUFFOUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsc0JBQXNCLENBQUM7UUFDcEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxzQkFBc0IsQ0FBQztRQUU1QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsd0JBQXdCLENBQUMifQ==