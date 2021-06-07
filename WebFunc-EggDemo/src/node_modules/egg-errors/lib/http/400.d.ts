import HttpError from './http_error';
declare class BadRequestError extends HttpError {
    constructor(message?: string);
}
export default BadRequestError;
