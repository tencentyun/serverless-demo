import HttpError from './http_error';
declare class ForbiddenError extends HttpError {
    constructor(message?: string);
}
export default ForbiddenError;
