import HttpError from './http_error';
declare class HTTPVersionNotSupportedError extends HttpError {
    constructor(message?: string);
}
export default HTTPVersionNotSupportedError;
