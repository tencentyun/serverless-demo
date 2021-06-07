import HttpError from './http_error';
declare class UnauthorizedError extends HttpError {
    constructor(message?: string);
}
export default UnauthorizedError;
