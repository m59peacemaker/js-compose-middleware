'use strict'

var compose = function (middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('middleware stack must be an array')
  }

  middleware.forEach(function (fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be composed of functions')
    }
  })

  return function (incoming, next) {
    var dispatch = function (i) {
      try {
        var fn = i === middleware.length ? next : middleware[i]
        var called
        var result = !fn ? incoming : fn(incoming, function next (nextIncoming) {
          if (called) { throw new Error('next() called multiple times') }
          called = true
          incoming = nextIncoming
          return dispatch(i + 1)
        })
        return Promise.resolve(result)
      } catch (err) {
        return Promise.reject(err)
      }
    }
    return dispatch(0)
  }
}

module.exports = compose
