'use strict'

const test = require('tape')
const compose = require('./')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test('compose middleware', t => {
  t.test('should work', async t => {
    t.plan(1)

    const arr = []
    const stack = []

    stack.push(async (context, next) => {
      arr.push(1)
      await wait(1)
      await next(context)
      await wait(1)
      arr.push(6)
    })

    stack.push(async (context, next) => {
      arr.push(2)
      await wait(1)
      await next(context)
      await wait(1)
      arr.push(5)
    })

    stack.push(async (context, next) => {
      arr.push(3)
      await wait(1)
      await next(context)
      await wait(1)
      arr.push(4)
    })

    await compose(stack)()
    t.deepEqual(arr, [1, 2, 3, 4, 5, 6])
  })

  t.test('should be able to be called twice', async t => {
    t.plan(2)

    const stack = []

    stack.push(async (context, next) => {
      context.arr.push(1)
      await wait(1)
      await next(context)
      await wait(1)
      context.arr.push(6)
    })

    stack.push(async (context, next) => {
      context.arr.push(2)
      await wait(1)
      await next(context)
      await wait(1)
      context.arr.push(5)
    })

    stack.push(async (context, next) => {
      context.arr.push(3)
      await wait(1)
      await next(context)
      await wait(1)
      context.arr.push(4)
    })

    const fn = compose(stack)
    const context1 = { arr: [] }
    const context2 = { arr: [] }
    const out = [1, 2, 3, 4, 5, 6]

    await fn(context1)
    t.deepEqual(out, context1.arr)

    await fn(context2)
    t.deepEqual(out, context2.arr)
  })

  t.test('should only accept an array', t => {
    t.plan(4)
    ;[undefined, {}, 123, 'abc'].forEach(arg => {
      try {
        compose(arg)
        t.fail('did not throw')
      } catch (err) {
        t.true(err instanceof TypeError, 'threw TypeError')
      }
    })
  })

  t.test('should work with 0 middleware', t => {
    t.plan(1)
    t.true(compose([])() instanceof Promise)
  })

  t.test('should only accept middleware as functions', t => {
    t.plan(4)
    ;[undefined, {}, 123, 'abc'].forEach(arg => {
      try {
        compose([arg])
        t.fail('did not throw')
      } catch (err) {
        t.true(err instanceof TypeError, 'threw TypeError')
      }
    })
  })

  t.test('should work when yielding at the end of the stack', async t => {
    t.plan(1)

    const stack = []
    let called = false

    stack.push(async (context, next) => {
      await next(context)
      called = true
    })

    await compose(stack)({})
    t.true(called)
  })

  t.test('should reject on errors in middleware', t => {
    t.plan(1)

    const stack = []

    stack.push(() => { throw new Error() })

    return compose(stack)()
      .then(() => {
        t.fail('promise was not rejected')
      })
      .catch(function (e) {
        t.true(e instanceof Error)
      })
  })

  t.test('should work when yielding at the end of the stack with yield*', t => {
    t.plan(1)

    const stack = []

    stack.push(async (context, next) => {
      await next
    })
    try {
      compose(stack)({})
      t.pass()
    } catch (err) {
      t.fail(err)
    }
  })

  t.test('should catch downstream errors', async t => {
    t.plan(1)

    const arr = []
    const stack = []

    stack.push(async (context, next) => {
      arr.push(1)
      try {
        arr.push(6)
        await next(context)
        arr.push(7)
      } catch (err) {
        arr.push(2)
      }
      arr.push(3)
    })

    stack.push(async (context, next) => {
      arr.push(4)
      throw new Error()
    })

    await compose(stack)()
    t.deepEqual(arr, [1, 6, 4, 2, 3])
  })

  t.test('should handle errors in wrapped non-async functions', async t => {
    t.plan(1)

    const stack = []

    stack.push(function () {
      throw new Error()
    })

    return compose(stack)({}).then(function () {
      throw new Error('promise was not rejected')
    }).catch(function (e) {
      t.pass('threw error')
    })
  })

  t.test('should compose w/ next', async t => {
    t.plan(1)

    let called = false
    await compose([])({}, async () => {
      called = true
    })
    t.true(called)
  })


  // https://github.com/koajs/compose/pull/27#issuecomment-143109739
  t.test('should compose w/ other compositions', async t => {
    t.plan(1)

    const called = []

    await compose([
      compose([
        (context, next) => {
          called.push(1)
          return next(context)
        },
        (context, next) => {
          called.push(2)
          return next(context)
        }
      ]),
      (context, next) => {
        called.push(3)
        return next(context)
      }
    ])({})
    t.deepEqual(called, [1, 2, 3])
  })

  t.test('should throw if next(context) is called multiple times', t => {
    t.plan(2)

    compose([
      async (context, next) => {
        await next(context)
        await next(context)
      }
    ])({})
      .then(() => t.fail('did not throw'))
      .catch(err => {
        t.pass('threw')
        t.true(/multiple times/.test(err.message))
      })
  })

  t.test('should return a valid middleware', async t => {
    t.plan(1)

    let val = 0
    compose([
      compose([
        (context, next) => {
          val++
          return next(context)
        },
        (context, next) => {
          val++
          return next(context)
        }
      ]),
      (context, next) => {
        val++
        return next(context)
      }
    ])({}).then(function () {
      t.equal(val, 3)
    })
  })

  t.test('should return last return value', async t => {
    t.plan(3)

    const stack = []

    stack.push(async (context, next) => {
      const val = await next(context)
      t.equal(val, 2)
      return 1
    })

    stack.push(async (context, next) => {
      const val = await next(context)
      t.equal(val, 0)
      return 2
    })
    const next = () => 0
    return compose(stack)({}, next).then(function (val) {
      t.equal(val, 1)
    })
  })

  t.test('should not affect the original middleware array', t => {
    t.plan(2)

    const middleware = []
    const fn = (context, next) => {
      return next(context)
    }
    middleware.push(fn)

    compose(middleware)

    t.equal(middleware.length, 1)
    t.equal(middleware[0], fn)
  })

  t.test('should not get stuck on the passed in next', t => {
    t.plan(1)

    const middleware = [(context, next) => {
      context.middleware++
      return next(context)
    }]

    const context = {
      middleware: 0,
      next: 0
    }

    compose(middleware)(context, (context, next) => {
      context.next++
      return next(context)
    }).then(() => {
      t.deepEqual(context, { middleware: 1, next: 1 })
    })
  })

  t,test('next() should take context and it should be passed to next middleware', t => {
    t.plan(1)

    compose([
      (context, next) => next(Object.assign({ bar: 456 }, context)),
      (context, next) => next(Object.assign({ baz: 789 }, context))
    ])({ foo: 123 }).then(result => t.deepEqual(result, { foo: 123, bar: 456, baz: 789 }))
  })

})
