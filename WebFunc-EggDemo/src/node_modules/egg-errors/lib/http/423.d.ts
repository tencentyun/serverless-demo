import HttpError from './http_error';
declare class LockedError extends HttpError {
    constructor(message?: string);
}
export default LockedError;
