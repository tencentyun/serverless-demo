import HttpError from './http_error';
declare class UnprocessableEntityError extends HttpError {
    constructor(message?: string);
}
export default UnprocessableEntityError;
