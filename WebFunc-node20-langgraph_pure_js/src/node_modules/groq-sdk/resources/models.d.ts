import * as Core from 'groq-sdk/core';
import { APIResource } from 'groq-sdk/resource';
import * as ModelsAPI from 'groq-sdk/resources/models';
export declare class Models extends APIResource {
    /**
     * Get a specific model
     */
    retrieve(model: string, options?: Core.RequestOptions): Core.APIPromise<Model>;
    /**
     * get all available models
     */
    list(options?: Core.RequestOptions): Core.APIPromise<ModelList>;
    /**
     * Delete a model
     */
    delete(model: string, options?: Core.RequestOptions): Core.APIPromise<void>;
}
export interface Model {
    id?: string;
    created?: number;
    object?: string;
    owned_by?: string;
}
export interface ModelList {
    data?: Array<Model>;
    object?: string;
}
export declare namespace Models {
    export import Model = ModelsAPI.Model;
    export import ModelList = ModelsAPI.ModelList;
}
//# sourceMappingURL=models.d.ts.map