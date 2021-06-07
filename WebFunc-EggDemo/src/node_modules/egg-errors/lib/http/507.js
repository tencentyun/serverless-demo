"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class InsufficientStorageError extends http_error_1.default {
    constructor(message) {
        const status = 507;
        const code = 'INSUFFICIENT_STORAGE';
        message = message || 'Insufficient Storage';
        super({ code, message, status });
    }
}
exports.default = InsufficientStorageError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTA3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTA3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sd0JBQXlCLFNBQVEsb0JBQVM7SUFFOUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsc0JBQXNCLENBQUM7UUFDcEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxzQkFBc0IsQ0FBQztRQUU1QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsd0JBQXdCLENBQUMifQ==