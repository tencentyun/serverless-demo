"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class UpgradeRequiredError extends http_error_1.default {
    constructor(message) {
        const status = 426;
        const code = 'UPGRADE_REQUIRED';
        message = message || 'Upgrade Required';
        super({ code, message, status });
    }
}
exports.default = UpgradeRequiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNDI2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNDI2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sb0JBQXFCLFNBQVEsb0JBQVM7SUFFMUMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUM7UUFDaEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQztRQUV4QyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsb0JBQW9CLENBQUMifQ==