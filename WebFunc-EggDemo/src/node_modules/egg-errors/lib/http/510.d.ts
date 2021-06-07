import HttpError from './http_error';
declare class NotExtendedError extends HttpError {
    constructor(message?: string);
}
export default NotExtendedError;
