import HttpError from './http_error';
declare class UnavailableForLegalReasonsError extends HttpError {
    constructor(message?: string);
}
export default UnavailableForLegalReasonsError;
