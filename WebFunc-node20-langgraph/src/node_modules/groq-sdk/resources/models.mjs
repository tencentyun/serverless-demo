// File generated from our OpenAPI spec by Stainless.
import { APIResource } from 'groq-sdk/resource';
export class Models extends APIResource {
    /**
     * Get a specific model
     */
    retrieve(model, options) {
        return this._client.get(`/openai/v1/models/${model}`, options);
    }
    /**
     * get all available models
     */
    list(options) {
        return this._client.get('/openai/v1/models', options);
    }
    /**
     * Delete a model
     */
    delete(model, options) {
        return this._client.delete(`/openai/v1/models/${model}`, {
            ...options,
            headers: { Accept: '*/*', ...options?.headers },
        });
    }
}
(function (Models) {
})(Models || (Models = {}));
//# sourceMappingURL=models.mjs.map