"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const utils_1 = require("../utils");
class BillingService {
    constructor(context) {
        this.billService = new utils_1.CloudService(context, BillingService.billServiceVersion.service, BillingService.billServiceVersion.version);
    }
    /**
     * 创建订单
     * @param {Array<IGoodItem>} goods
     * @returns {Promise<IGenerateDealsRes>}
     * @memberof BillingService
     */
    async GenerateDeals(goods) {
        return this.billService.request('GenerateDeals', {
            Goods: goods
        });
    }
    /**
     * 支付订单
     * @param {Array<string>} orderIds
     * @returns {Promise<IPayDealsRes>}
     * @memberof BillingService
     */
    async PayDeals(orderIds) {
        return this.billService.request('PayDeals', {
            OrderIds: orderIds
        });
    }
}
exports.BillingService = BillingService;
BillingService.billServiceVersion = {
    service: 'billing',
    version: '2018-07-09'
};
