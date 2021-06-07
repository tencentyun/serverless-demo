import HttpError from './http_error';
declare class GoneError extends HttpError {
    constructor(message?: string);
}
export default GoneError;
