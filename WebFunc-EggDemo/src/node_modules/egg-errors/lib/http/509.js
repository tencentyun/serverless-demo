"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class BandwidthLimitExceededError extends http_error_1.default {
    constructor(message) {
        const status = 509;
        const code = 'BANDWIDTH_LIMIT_EXCEEDED';
        message = message || 'Bandwidth Limit Exceeded';
        super({ code, message, status });
    }
}
exports.default = BandwidthLimitExceededError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTA5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTA5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0sMkJBQTRCLFNBQVEsb0JBQVM7SUFFakQsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7UUFDeEMsT0FBTyxHQUFHLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQztRQUVoRCxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBRUQsa0JBQWUsMkJBQTJCLENBQUMifQ==