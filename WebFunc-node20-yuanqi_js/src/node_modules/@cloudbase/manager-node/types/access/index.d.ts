import { Environment } from '../environment';
import { ICreateAccessOptions, IApi, IUpdateOptions, IService, IDeleteOptions, IGetOptions, IDomainOptions } from './types';
import { IResponseInfo } from '../interfaces';
export declare class AccessService {
    private tcbService;
    private environment;
    constructor(environment: Environment);
    createAccess(options: ICreateAccessOptions): Promise<{
        APIId: string;
        RequestId: string;
    }>;
    getDomainList(): Promise<{
        RequestId: string;
        DefaultDomain: string;
        EnableService: boolean;
        ServiceSet: IService[];
    }>;
    getAccessList(options?: IGetOptions): Promise<{
        RequestId: string;
        APISet: IApi[];
        Total: number;
        Limit: number;
        Offset: number;
        EnableService: boolean;
    }>;
    switchAuth(auth: boolean): Promise<{
        Count: number;
        RequestId: string;
    }>;
    switchPathAuth(options: IUpdateOptions): Promise<{
        Count: number;
        RequestId: string;
    }>;
    deleteAccess(options: IDeleteOptions): Promise<IResponseInfo>;
    addCustomDomain(options: IDomainOptions): Promise<IResponseInfo>;
    deleteCustomDomain(domain: string): Promise<IResponseInfo>;
    private getEnvInfo;
}
