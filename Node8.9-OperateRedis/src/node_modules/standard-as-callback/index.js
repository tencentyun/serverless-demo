var utils = require('./lib/utils')
var tryCatch = utils.tryCatch
var errorObj = utils.errorObj

function throwLater (e) {
  setTimeout(function () {
    throw e
  }, 0)
}

function asCallback (promise, nodeback, options) {
  if (typeof nodeback === 'function') {
    promise.then(function (val) {
      var ret
      if (options !== undefined && Object(options).spread && Array.isArray(val)) {
        ret = tryCatch(nodeback).apply(undefined, [null].concat(val))
      } else {
        ret = val === undefined
          ? tryCatch(nodeback)(null)
          : tryCatch(nodeback)(null, val)
      }
      if (ret === errorObj) {
        throwLater(ret.e)
      }
    }, function (reason) {
      if (!reason) {
        var newReason = new Error(reason + '')
        newReason.cause = reason
        reason = newReason
      }
      var ret = tryCatch(nodeback)(reason)
      if (ret === errorObj) {
        throwLater(ret.e)
      }
    })
  }

  return promise
}

module.exports = asCallback
