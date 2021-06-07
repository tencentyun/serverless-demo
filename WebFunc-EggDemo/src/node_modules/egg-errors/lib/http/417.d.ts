import HttpError from './http_error';
declare class ExpectationFailedError extends HttpError {
    constructor(message?: string);
}
export default ExpectationFailedError;
