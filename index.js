'use strict'

var compose = function (middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!')
  }

  middleware.forEach(function (fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!')
    }
  })

  return function (incoming, next) {
    var idxLastCalled
    var dispatch = function (i) {
      try {
        if (i <= idxLastCalled) {
          throw new Error('next() called multiple times')
        }
        idxLastCalled = i
        var fn = i === middleware.length ? next : middleware[i]
        return !fn ? Promise.resolve(incoming) : Promise.resolve(fn(incoming, function next (x) {
          incoming = x
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
    return dispatch(0)
  }
}

module.exports = compose
