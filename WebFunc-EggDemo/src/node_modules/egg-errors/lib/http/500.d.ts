import HttpError from './http_error';
declare class InternalServerError extends HttpError {
    constructor(message?: string);
}
export default InternalServerError;
