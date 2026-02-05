"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typedUi = void 0;
const uuid_1 = require("uuid");
/**
 * Helper to send and persist UI messages. Accepts a map of component names to React components
 * as type argument to provide type safety. Will also write to the `options?.stateKey` state.
 *
 * @param config LangGraphRunnableConfig
 * @param options
 * @returns
 */
const typedUi = (config, options) => {
    const items = [];
    const stateKey = options?.stateKey ?? "ui";
    const runId = config.metadata?.run_id ?? config.runId;
    if (!runId)
        throw new Error("run_id is required");
    function handlePush(message, options) {
        const evt = {
            type: "ui",
            id: message?.id ?? (0, uuid_1.v4)(),
            name: message?.name,
            props: message?.props,
            metadata: {
                merge: options?.merge || undefined,
                run_id: runId,
                tags: config.tags,
                name: config.runName,
                ...message?.metadata,
                ...(options?.message ? { message_id: options.message.id } : null),
            },
        };
        items.push(evt);
        config.writer?.(evt);
        config.configurable?.__pregel_send?.([[stateKey, evt]]);
        return evt;
    }
    const handleDelete = (id) => {
        const evt = { type: "remove-ui", id };
        items.push(evt);
        config.writer?.(evt);
        config.configurable?.__pregel_send?.([[stateKey, evt]]);
        return evt;
    };
    return { push: handlePush, delete: handleDelete, items };
};
exports.typedUi = typedUi;
