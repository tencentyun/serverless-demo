// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import * as SessionsAPI from "./sessions.mjs";
import { Sessions } from "./sessions.mjs";
import * as ThreadsAPI from "./threads.mjs";
import { Threads, } from "./threads.mjs";
import { buildHeaders } from "../../../internal/headers.mjs";
import { maybeMultipartFormRequestOptions } from "../../../internal/uploads.mjs";
export class ChatKit extends APIResource {
    constructor() {
        super(...arguments);
        this.sessions = new SessionsAPI.Sessions(this._client);
        this.threads = new ThreadsAPI.Threads(this._client);
    }
    /**
     * Upload a ChatKit file
     *
     * @example
     * ```ts
     * const response = await client.beta.chatkit.uploadFile({
     *   file: fs.createReadStream('path/to/file'),
     * });
     * ```
     */
    uploadFile(body, options) {
        return this._client.post('/chatkit/files', maybeMultipartFormRequestOptions({ body, ...options, headers: buildHeaders([{ 'OpenAI-Beta': 'chatkit_beta=v1' }, options?.headers]) }, this._client));
    }
}
ChatKit.Sessions = Sessions;
ChatKit.Threads = Threads;
//# sourceMappingURL=chatkit.mjs.map