const { requestPromiseRetry, logger } = require('./utils');

module.exports = async ({ response, callbackUrl }) => {
  const extraMessage = {};
  try {
    const requestParams = {
      uri: callbackUrl,
      method: 'POST',
      json: response,
    };

    extraMessage.requestParams = requestParams;

    const requestResponse = await requestPromiseRetry(requestParams);

    logger({
      title: 'request callback url success',
      data: {
        ...extraMessage,
        requestResponse,
      },
    });
  } catch (err) {
    logger({
      title: 'request callback url fail',
      data: {
        ...extraMessage,
        requestError: err.message ? { message: err.message } : err,
      },
    });
  }
};
