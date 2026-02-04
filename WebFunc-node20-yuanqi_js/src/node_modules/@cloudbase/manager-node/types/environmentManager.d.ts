import { Environment } from './environment';
import { CloudBaseContext } from './context';
export declare class EnvironmentManager {
    private cloudBaseContext;
    private envs;
    private currentEnv;
    constructor(context: CloudBaseContext);
    getCurrentEnv(): Environment;
    add(envId: string): void;
    remove(envId: string): void;
    get(envId: string): Environment | null;
    switchEnv(envId: string): boolean;
}
