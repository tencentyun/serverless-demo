import HttpError from './http_error';
declare class UnorderedCollectionError extends HttpError {
    constructor(message?: string);
}
export default UnorderedCollectionError;
