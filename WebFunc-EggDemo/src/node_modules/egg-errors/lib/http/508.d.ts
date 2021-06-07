import HttpError from './http_error';
declare class LoopDetectedError extends HttpError {
    constructor(message?: string);
}
export default LoopDetectedError;
