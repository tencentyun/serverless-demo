"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.createApis = void 0;
const openapi_typescript_fetch_1 = require("@qdrant/openapi-typescript-fetch");
const dispatcher_js_1 = require("./dispatcher.js");
const cluster_api_js_1 = require("./api/cluster-api.js");
const collections_api_js_1 = require("./api/collections-api.js");
const points_api_js_1 = require("./api/points-api.js");
const service_api_js_1 = require("./api/service-api.js");
const snapshots_api_js_1 = require("./api/snapshots-api.js");
const shards_api_js_1 = require("./api/shards-api.js");
const errors_js_1 = require("./errors.js");
function createApis(baseUrl, args) {
    const client = createClient(baseUrl, args);
    return {
        cluster: (0, cluster_api_js_1.createClusterApi)(client),
        collections: (0, collections_api_js_1.createCollectionsApi)(client),
        points: (0, points_api_js_1.createPointsApi)(client),
        service: (0, service_api_js_1.createServiceApi)(client),
        snapshots: (0, snapshots_api_js_1.createSnapshotsApi)(client),
        shards: (0, shards_api_js_1.createShardsApi)(client),
    };
}
exports.createApis = createApis;
function createClient(baseUrl, { headers, timeout, connections }) {
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
                    throw new errors_js_1.QdrantClientTimeoutError(e.message);
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
        throw errors_js_1.QdrantClientUnexpectedResponseError.forResponse(response);
    });
    const client = openapi_typescript_fetch_1.Fetcher.for();
    // Configure client with 'undici' agent which is used in Node 18+
    client.configure({
        baseUrl,
        init: {
            headers,
            dispatcher: typeof process !== 'undefined' &&
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                process.versions?.node
                ? (0, dispatcher_js_1.createDispatcher)(connections)
                : undefined,
        },
        use,
    });
    return client;
}
exports.createClient = createClient;
