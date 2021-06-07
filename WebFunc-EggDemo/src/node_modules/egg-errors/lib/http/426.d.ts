import HttpError from './http_error';
declare class UpgradeRequiredError extends HttpError {
    constructor(message?: string);
}
export default UpgradeRequiredError;
