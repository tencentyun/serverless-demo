"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_error_1 = require("./http_error");
class LoopDetectedError extends http_error_1.default {
    constructor(message) {
        const status = 508;
        const code = 'LOOP_DETECTED';
        message = message || 'Loop Detected';
        super({ code, message, status });
    }
}
exports.default = LoopDetectedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiNTA4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiNTA4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFDO0FBRXJDLE1BQU0saUJBQWtCLFNBQVEsb0JBQVM7SUFFdkMsWUFBWSxPQUFnQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDO1FBQzdCLE9BQU8sR0FBRyxPQUFPLElBQUksZUFBZSxDQUFDO1FBRXJDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQyJ9