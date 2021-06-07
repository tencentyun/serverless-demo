"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UnorderedCollectionError extends http_error_1.default {
    constructor(message) {
        const status = 425;
        const code = 'UNORDERED_COLLECTION';
        message = message || 'Unordered Collection';
        super({ code, message, status });
    }
}
exports.default = UnorderedCollectionError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDI1LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDI1LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sd0JBQXlCLFNBQVEsb0JBQVM7SUFFOUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsc0JBQXNCLENBQUM7UUFDcEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxzQkFBc0IsQ0FBQztRQUU1QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsd0JBQXdCLENBQUMifQ==