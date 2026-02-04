"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThirdService = void 0;
const utils_1 = require("../utils");
class ThirdService {
    constructor(environment) {
        this.cloudService = new utils_1.CloudService(environment.cloudBaseContext, 'tcb', '2018-06-08');
    }
    // 解除第三方小程序绑定
    async deleteThirdPartAttach(options) {
        const { ThirdPartAppid, TypeFlag } = options;
        return this.cloudService.request('DeleteThirdPartAttach', {
            ThirdPartAppid,
            TypeFlag
        });
    }
}
exports.ThirdService = ThirdService;
