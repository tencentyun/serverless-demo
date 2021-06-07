import HttpError from './http_error';
declare class MethodNotAllowedError extends HttpError {
    constructor(message?: string);
}
export default MethodNotAllowedError;
