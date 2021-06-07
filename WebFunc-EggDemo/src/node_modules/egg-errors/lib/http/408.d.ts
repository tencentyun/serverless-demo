import HttpError from './http_error';
declare class RequestTimeoutError extends HttpError {
    constructor(message?: string);
}
export default RequestTimeoutError;
