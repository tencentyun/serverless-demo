import HttpError from './http_error';
declare class ImATeapotError extends HttpError {
    constructor(message?: string);
}
export default ImATeapotError;
