import HttpError from './http_error';
declare class ConflictError extends HttpError {
    constructor(message?: string);
}
export default ConflictError;
