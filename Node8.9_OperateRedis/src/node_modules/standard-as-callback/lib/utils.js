//Try catch is not supported in optimizing
//compiler, so it is isolated
var errorObj = {e: {}};
var tryCatchTarget;

function tryCatcher() {
  try {
    var target = tryCatchTarget
    tryCatchTarget = null
    return target.apply(this, arguments)
  } catch (e) {
    errorObj.e = e
    return errorObj
  }
}
function tryCatch(fn) {
  tryCatchTarget = fn
  return tryCatcher
}

exports.tryCatch = tryCatch
exports.errorObj = errorObj
