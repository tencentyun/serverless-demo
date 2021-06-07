import HttpError from './http_error';
declare class NotFoundError extends HttpError {
    constructor(message?: string);
}
export default NotFoundError;
