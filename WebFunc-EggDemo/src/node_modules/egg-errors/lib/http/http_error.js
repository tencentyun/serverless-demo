"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_error_1 = require("../base_error");
class HttpError extends base_error_1.default {
    constructor(options) {
        super(options);
        this.headers = {};
        this.status = this.options.status;
        this.headers = this.options.headers || {};
    }
}
exports.default = HttpError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9lcnJvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBfZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw4Q0FBcUM7QUFJckMsTUFBTSxTQUFVLFNBQVEsb0JBQTBCO0lBTWhELFlBQVksT0FBMEI7UUFDcEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWYsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0NBRUY7QUFFRCxrQkFBZSxTQUFTLENBQUMifQ==