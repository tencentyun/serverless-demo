import { CloudBaseContext } from '../context';
export declare class CloudService {
    service: string;
    version: string;
    url: string;
    action: string;
    method: 'POST' | 'GET';
    secretId: string;
    secretKey: string;
    token: string;
    timeout: number;
    data: Record<string, any>;
    payload: Record<string, any>;
    baseParams: Record<string, any>;
    cloudBaseContext: CloudBaseContext;
    constructor(context: CloudBaseContext, service: string, version: string, baseParams?: Record<string, any>);
    get baseUrl(): any;
    request<T extends {}>(action: string, data?: Record<string, any>, method?: 'POST' | 'GET'): Promise<T>;
    requestWithSign(): Promise<any>;
    getRequestSign(timestamp: number): string;
}
