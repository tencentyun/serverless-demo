import { createRetryingTransport } from './retrying-transport';
import { createSendBeaconTransport } from './transport/send-beacon-transport';
import { createOtlpNetworkExportDelegate } from './otlp-network-export-delegate';
import { createFetchTransport } from './transport/fetch-transport';
export function createOtlpFetchExportDelegate(options, serializer) {
    return createOtlpNetworkExportDelegate(options, serializer, createRetryingTransport({
        transport: createFetchTransport(options),
    }));
}
export function createOtlpSendBeaconExportDelegate(options, serializer) {
    return createOtlpNetworkExportDelegate(options, serializer, createRetryingTransport({
        transport: createSendBeaconTransport({
            url: options.url,
            headers: options.headers,
        }),
    }));
}
//# sourceMappingURL=otlp-browser-http-export-delegate.js.map