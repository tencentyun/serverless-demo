import HttpError from './http_error';
declare class RangeNotSatisfiableError extends HttpError {
    constructor(message?: string);
}
export default RangeNotSatisfiableError;
