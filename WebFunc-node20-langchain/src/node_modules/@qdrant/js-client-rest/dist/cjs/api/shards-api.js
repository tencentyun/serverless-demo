"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShardsApi = void 0;
function createShardsApi(client) {
    return {
        /**
         * Create shard key
         */
        createShardKey: client.path('/collections/{collection_name}/shards').method('put').create({ timeout: true }),
        /**
         * Delete shard key
         */
        deleteShardKey: client
            .path('/collections/{collection_name}/shards/delete')
            .method('post')
            .create({ timeout: true }),
    };
}
exports.createShardsApi = createShardsApi;
