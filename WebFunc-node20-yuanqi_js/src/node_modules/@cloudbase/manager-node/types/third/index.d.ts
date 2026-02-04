import { Environment } from '../environment';
export declare class ThirdService {
    private cloudService;
    constructor(environment: Environment);
    deleteThirdPartAttach(options: {
        ThirdPartAppid: string;
        TypeFlag: number;
    }): Promise<{
        RequestId: string;
    }>;
}
