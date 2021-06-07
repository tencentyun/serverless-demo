import HttpError from './http_error';
declare class InsufficientStorageError extends HttpError {
    constructor(message?: string);
}
export default InsufficientStorageError;
