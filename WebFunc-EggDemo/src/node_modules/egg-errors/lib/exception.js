"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_exception_1 = require("./base_exception");
class EggException extends base_exception_1.default {
    constructor(message) {
        super({
            code: 'EGG_EXCEPTION',
            message: message || '',
        });
    }
}
exports.default = EggException;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZXB0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhjZXB0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EscURBQWdEO0FBRWhELE1BQU0sWUFBYSxTQUFRLHdCQUE4QjtJQUN2RCxZQUFZLE9BQWdCO1FBQzFCLEtBQUssQ0FBQztZQUNKLElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRSxPQUFPLElBQUksRUFBRTtTQUN2QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxZQUFZLENBQUMifQ==