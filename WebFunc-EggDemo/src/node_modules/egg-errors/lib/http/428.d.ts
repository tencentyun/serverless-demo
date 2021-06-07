import HttpError from './http_error';
declare class PreconditionRequiredError extends HttpError {
    constructor(message?: string);
}
export default PreconditionRequiredError;
