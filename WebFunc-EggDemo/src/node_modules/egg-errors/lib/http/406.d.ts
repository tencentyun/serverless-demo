import HttpError from './http_error';
declare class NotAcceptableError extends HttpError {
    constructor(message?: string);
}
export default NotAcceptableError;
