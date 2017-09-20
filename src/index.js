const composeMiddleware = middleware => {
  if (!Array.isArray(middleware)) {
    throw new TypeError('middleware stack must be an array')
  }

  middleware.forEach(shouldBeFn => {
    if (typeof shouldBeFn !== 'function') {
      throw new TypeError('middleware must be composed of functions')
    }
  })

  return function composedMiddleware (incoming, next) {
    const dispatch = i => Promise.resolve().then(() => {
      const fn = i === middleware.length ? next : middleware[i]
      let called
      return !fn
        ? incoming
        : fn(incoming, function next (nextIncoming) {
          if (called) { throw new Error('next() called multiple times') }
          called = true
          incoming = nextIncoming
          return dispatch(i + 1)
        })
    })
    return dispatch(0)
  }
}

export default composeMiddleware
