import HttpError from './http_error';
declare class NotImplementedError extends HttpError {
    constructor(message?: string);
}
export default NotImplementedError;
