import { Fetcher } from '@qdrant/openapi-typescript-fetch';
import { createDispatcher } from './dispatcher.js';
import { createClusterApi } from './api/cluster-api.js';
import { createCollectionsApi } from './api/collections-api.js';
import { createPointsApi } from './api/points-api.js';
import { createServiceApi } from './api/service-api.js';
import { createSnapshotsApi } from './api/snapshots-api.js';
import { createShardsApi } from './api/shards-api.js';
import { QdrantClientTimeoutError, QdrantClientUnexpectedResponseError } from './errors.js';
export function createApis(baseUrl, args) {
    const client = createClient(baseUrl, args);
    return {
        cluster: createClusterApi(client),
        collections: createCollectionsApi(client),
        points: createPointsApi(client),
        service: createServiceApi(client),
        snapshots: createSnapshotsApi(client),
        shards: createShardsApi(client),
    };
}
export function createClient(baseUrl, { headers, timeout, connections }) {
    const use = [];
    if (Number.isFinite(timeout)) {
        use.push(async (url, init, next) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                return await next(url, Object.assign(init, { signal: controller.signal }));
            }
            catch (e) {
                if (e instanceof Error && e.name === 'AbortError') {
                    throw new QdrantClientTimeoutError(e.message);
                }
                throw e;
            }
            finally {
                clearTimeout(id);
            }
        });
    }
    use.push(async (url, init, next) => {
        const response = await next(url, init);
        if (response.status === 200 || response.status === 201) {
            return response;
        }
        throw QdrantClientUnexpectedResponseError.forResponse(response);
    });
    const client = Fetcher.for();
    // Configure client with 'undici' agent which is used in Node 18+
    client.configure({
        baseUrl,
        init: {
            headers,
            dispatcher: typeof process !== 'undefined' &&
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                process.versions?.node
                ? createDispatcher(connections)
                : undefined,
        },
        use,
    });
    return client;
}
