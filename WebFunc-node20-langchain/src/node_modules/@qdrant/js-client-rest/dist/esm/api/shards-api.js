export function createShardsApi(client) {
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
