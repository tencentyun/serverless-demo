import { CloudBaseContext } from '../context';
import { IServiceVersion, IGoodItem, IGenerateDealsRes, IPayDealsRes } from '../interfaces';
export declare class BillingService {
    static billServiceVersion: IServiceVersion;
    private billService;
    constructor(context: CloudBaseContext);
    /**
     * 创建订单
     * @param {Array<IGoodItem>} goods
     * @returns {Promise<IGenerateDealsRes>}
     * @memberof BillingService
     */
    GenerateDeals(goods: Array<IGoodItem>): Promise<IGenerateDealsRes>;
    /**
     * 支付订单
     * @param {Array<string>} orderIds
     * @returns {Promise<IPayDealsRes>}
     * @memberof BillingService
     */
    PayDeals(orderIds: Array<string>): Promise<IPayDealsRes>;
}
