import HttpError from './http_error';
declare class RequestHeaderFieldsTooLargeError extends HttpError {
    constructor(message?: string);
}
export default RequestHeaderFieldsTooLargeError;
