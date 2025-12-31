import { O as Ollama$1, C as CreateRequest, A as AbortableAsyncIterator, P as ProgressResponse } from './shared/ollama.415fa141.js';
export { d as ChatRequest, j as ChatResponse, a as Config, g as CopyRequest, D as DeleteRequest, E as EmbedRequest, k as EmbedResponse, h as EmbeddingsRequest, l as EmbeddingsResponse, p as ErrorResponse, F as Fetch, G as GenerateRequest, i as GenerateResponse, L as ListResponse, M as Message, n as ModelDetails, m as ModelResponse, b as Options, e as PullRequest, f as PushRequest, S as ShowRequest, o as ShowResponse, q as StatusResponse, c as Tool, T as ToolCall } from './shared/ollama.415fa141.js';

declare class Ollama extends Ollama$1 {
    encodeImage(image: Uint8Array | Buffer | string): Promise<string>;
    /**
     * checks if a file exists
     * @param path {string} - The path to the file
     * @private @internal
     * @returns {Promise<boolean>} - Whether the file exists or not
     */
    private fileExists;
    create(request: CreateRequest & {
        stream: true;
    }): Promise<AbortableAsyncIterator<ProgressResponse>>;
    create(request: CreateRequest & {
        stream?: false;
    }): Promise<ProgressResponse>;
}
declare const _default: Ollama;

export { AbortableAsyncIterator, CreateRequest, Ollama, ProgressResponse, _default as default };
