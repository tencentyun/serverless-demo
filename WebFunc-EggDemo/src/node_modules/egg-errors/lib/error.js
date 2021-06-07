"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_error_1 = require("./base_error");
class EggError extends base_error_1.default {
    constructor(message) {
        super({
            code: 'EGG_ERROR',
            message: message || '',
        });
    }
}
exports.default = EggError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZDQUF3QztBQUV4QyxNQUFNLFFBQVMsU0FBUSxvQkFBMEI7SUFDL0MsWUFBWSxPQUFnQjtRQUMxQixLQUFLLENBQUM7WUFDSixJQUFJLEVBQUUsV0FBVztZQUNqQixPQUFPLEVBQUUsT0FBTyxJQUFJLEVBQUU7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsa0JBQWUsUUFBUSxDQUFDIn0=