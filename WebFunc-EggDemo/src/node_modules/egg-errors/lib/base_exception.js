"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const error_type_1 = require("./error_type");
const TYPE = Symbol.for('BaseError#type');
class EggBaseException extends base_1.default {
    constructor(options) {
        super(options);
        this[TYPE] = error_type_1.default.EXCEPTION;
    }
}
exports.default = EggBaseException;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9leGNlcHRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiYXNlX2V4Y2VwdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUErQjtBQUUvQiw2Q0FBcUM7QUFFckMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRTFDLE1BQU0sZ0JBQXlDLFNBQVEsY0FBWTtJQUNqRSxZQUFZLE9BQVc7UUFDckIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWQsSUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFTLENBQUMsU0FBUyxDQUFDO0lBQzVDLENBQUM7Q0FDRjtBQUVELGtCQUFlLGdCQUFnQixDQUFDIn0=