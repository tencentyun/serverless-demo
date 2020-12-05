var timeout = require('promise-timeout').timeout

module.exports = {
  awaitGlobalException: function(fn) {
    function replaceListeners(by) {
      var single = typeof by === 'function'
      if (process.title === 'browser') {
        var original = window.onerror
        window.onerror = single ? function(message, file, line, column, e) {
          return by(e)
        } : by[0]
        return [original]
      } else {
        var original = process.listeners('uncaughtException')
        process.removeAllListeners('uncaughtException')
        if (single) by = [by]
        by.forEach(function(listener) {
          process.on('uncaughtException', listener)
        })
        return original
      }
    }
    return new Promise(function(resolve, reject) {
      var listeners = replaceListeners(function(e) {
        var err
        var ret
        try {
          ret = fn(e)
        } catch (e) {
          err = e
        }
        if (!err && ret === false) return
        replaceListeners(listeners)
        delayPromise(1).then(function() {
          if (err) reject(err)
          resolve()
        })
      })
    })
  },

  getSpy: function() {
    var resolve, reject
    var promise = timeout(new Promise(function() {
      resolve = arguments[0]
      reject = arguments[1]
    }), 500)
    var ret = function(fn) {
      ret.callback = fn
      return ret.node
    }
    ret.promise = promise
    ret.node = function() {
      try {
        ret.callback.apply(this, arguments)
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    return ret
  },

  isNodeJS: typeof process !== 'undefined' && typeof process.execPath === 'string'
}

function delayPromise (timeout) {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout)
  })
}
