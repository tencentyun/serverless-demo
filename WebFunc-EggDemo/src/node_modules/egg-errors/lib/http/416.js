"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class RangeNotSatisfiableError extends http_error_1.default {
    constructor(message) {
        const status = 416;
        const code = 'RANGE_NOT_SATISFIABLE';
        message = message || 'Range Not Satisfiable';
        super({ code, message, status });
    }
}
exports.default = RangeNotSatisfiableError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDE2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDE2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sd0JBQXlCLFNBQVEsb0JBQVM7SUFFOUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsdUJBQXVCLENBQUM7UUFDckMsT0FBTyxHQUFHLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQztRQUU3QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsd0JBQXdCLENBQUMifQ==