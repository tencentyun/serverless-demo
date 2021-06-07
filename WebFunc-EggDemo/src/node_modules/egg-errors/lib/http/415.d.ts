import HttpError from './http_error';
declare class UnsupportedMediaTypeError extends HttpError {
    constructor(message?: string);
}
export default UnsupportedMediaTypeError;
