import HttpError from './http_error';
declare class PreconditionFailedError extends HttpError {
    constructor(message?: string);
}
export default PreconditionFailedError;
