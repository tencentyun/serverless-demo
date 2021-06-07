import { DynamicModule } from '../interfaces';
import { CacheModuleAsyncOptions, CacheModuleOptions } from './interfaces/cache-module.interface';
/**
 * Module that provides Nest cache-manager.
 *
 * @see [Caching](https://docs.nestjs.com/techniques/caching)
 *
 * @publicApi
 */
export declare class CacheModule {
    /**
     * Configure the cache manager statically.
     *
     * @param options options to configure the cache manager
     *
     * @see [Customize caching](https://docs.nestjs.com/techniques/caching#customize-caching)
     */
    static register(options?: CacheModuleOptions): DynamicModule;
    /**
     * Configure the cache manager dynamically.
     *
     * @param options method for dynamically supplying cache manager configuration
     * options
     *
     * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
     */
    static registerAsync(options: CacheModuleAsyncOptions): DynamicModule;
    private static createAsyncProviders;
    private static createAsyncOptionsProvider;
}
