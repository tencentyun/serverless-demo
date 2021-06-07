import HttpError from './http_error';
declare class URITooLongError extends HttpError {
    constructor(message?: string);
}
export default URITooLongError;
