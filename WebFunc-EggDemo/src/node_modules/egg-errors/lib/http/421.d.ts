import HttpError from './http_error';
declare class MisdirectedRequestError extends HttpError {
    constructor(message?: string);
}
export default MisdirectedRequestError;
