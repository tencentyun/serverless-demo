import HttpError from './http_error';
declare class TooManyRequestsError extends HttpError {
    constructor(message?: string);
}
export default TooManyRequestsError;
