"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_type_1 = require("./error_type");
const TYPE = Symbol.for('BaseError#type');
class BaseError extends Error {
    constructor(options) {
        super();
        this.options = options || {};
        this.message = this.options.message || '';
        this.code = this.options.code || '';
        this.name = this.constructor.name;
    }
    static getType(err) {
        return err[TYPE] || error_type_1.default.BUILTIN;
    }
    static from(err, ...args) {
        const ErrorClass = this;
        const newErr = new ErrorClass(...args);
        newErr.message = err.message;
        newErr.stack = err.stack;
        for (const key of Object.keys(err)) {
            newErr[key] = err[key];
        }
        return newErr;
    }
}
exports.default = BaseError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw2Q0FBcUM7QUFFckMsTUFBTSxJQUFJLEdBQVcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRWxELE1BQU0sU0FBa0MsU0FBUSxLQUFLO0lBeUJuRCxZQUFZLE9BQVc7UUFDckIsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFPLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUNwQyxDQUFDO0lBM0JNLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBVTtRQUM5QixPQUFRLEdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBUyxDQUFDLE9BQU8sQ0FBQztJQUNqRCxDQUFDO0lBRU0sTUFBTSxDQUFDLElBQUksQ0FHUCxHQUFVLEVBQUUsR0FBRyxJQUFxQjtRQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxJQUFhLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDN0IsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3pCLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3hCO1FBQ0QsT0FBTyxNQUF5QixDQUFDO0lBQ25DLENBQUM7Q0FhRjtBQUVELGtCQUFlLFNBQVMsQ0FBQyJ9