import { DynamicModule } from '../interfaces';
import { HttpModuleAsyncOptions, HttpModuleOptions } from './interfaces';
export declare class HttpModule {
    static register(config: HttpModuleOptions): DynamicModule;
    static registerAsync(options: HttpModuleAsyncOptions): DynamicModule;
    private static createAsyncProviders;
    private static createAsyncOptionsProvider;
}
