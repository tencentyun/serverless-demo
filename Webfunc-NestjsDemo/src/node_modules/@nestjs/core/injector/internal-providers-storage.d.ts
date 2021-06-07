import { HttpAdapterHost } from '../helpers';
import { AbstractHttpAdapter } from '../adapters';
export declare class InternalProvidersStorage {
    private readonly _httpAdapterHost;
    private _httpAdapter;
    get httpAdapterHost(): HttpAdapterHost;
    get httpAdapter(): AbstractHttpAdapter;
    set httpAdapter(httpAdapter: AbstractHttpAdapter);
}
