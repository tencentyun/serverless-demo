import HttpError from './http_error';
declare class LengthRequiredError extends HttpError {
    constructor(message?: string);
}
export default LengthRequiredError;
