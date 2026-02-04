import { Environment } from '../environment';
import { IModifyServerFlowOption } from './types';
export declare class CloudBaseRunService {
    private tcbService;
    private environment;
    constructor(environment: Environment);
    modifyServerFlow(options: IModifyServerFlowOption): Promise<{
        Result: string;
        RequestId: string;
    }>;
    private getEnvInfo;
}
