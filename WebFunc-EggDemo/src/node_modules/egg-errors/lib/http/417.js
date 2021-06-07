"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class ExpectationFailedError extends http_error_1.default {
    constructor(message) {
        const status = 417;
        const code = 'EXPECTATION_FAILED';
        message = message || 'Expectation Failed';
        super({ code, message, status });
    }
}
exports.default = ExpectationFailedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDE3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDE3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sc0JBQXVCLFNBQVEsb0JBQVM7SUFFNUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUM7UUFDbEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQztRQUUxQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsc0JBQXNCLENBQUMifQ==