import { Environment } from '../environment';
interface ICommonApiServiceOption {
    Action: string;
    Param: Record<string, any>;
}
export declare class CommonService {
    private commonService;
    private environment;
    constructor(environment: Environment, serviceType: string, serviceVersion: string);
    /**
     * 公共方法调用
     * @param {ICommonApiServiceParam} param
     * @returns {Promise<any>}
     * @memberof CommonService
     */
    call(options: ICommonApiServiceOption): Promise<any>;
}
export {};
