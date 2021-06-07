"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const error_type_1 = require("./error_type");
const TYPE = Symbol.for('BaseError#type');
class EggBaseError extends base_1.default {
    constructor(options) {
        super(options);
        this[TYPE] = error_type_1.default.ERROR;
    }
}
exports.default = EggBaseError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9lcnJvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2VfZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBK0I7QUFFL0IsNkNBQXFDO0FBRXJDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUUxQyxNQUFNLFlBQXFDLFNBQVEsY0FBWTtJQUM3RCxZQUFZLE9BQVc7UUFDckIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWQsSUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFTLENBQUMsS0FBSyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUVELGtCQUFlLFlBQVksQ0FBQyJ9