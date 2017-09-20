# @m59/compose-middleware

Generic promise-based middleware composer that is friendly to pure functions.

The primary difference from other middleware composing functions is that data in passed as arguments so that middleware is not forced to mutate it. Middleware can modify and pass on the same reference it is given, or it can make a new object and pass it on to the next middleware.

## install

```sh
$ npm install @m59/compose-middleware
```

## example

```js
const composeMiddleware = require('@m59/compose-middleware')

const addSlashBarToUrl = (request, next) => {
  /* you can mutate if you want (but it's not cool)
  request.url += '/bar'
  return next(request)
  */
  return next(Object.assign({}, request, { url: request.url + '/bar' }))
}

const changeMethodToGet = (request, next) => next(Object.assign({}, request, { method: 'GET' }))

// this middleware only deals with the response, but it could change the request too, if it wanted
const trollTheResponse = (request, next) => next(request)
  .then(response => '¯\_(ツ)_/¯')

const makeTheRequest = request => someAsyncRequest(request)

// middleware can modify the request object in the order they are given
composeMiddleware([
  addSlashBarToUrl
  changeMethodToGet,
  trollTheResponse,
  // the main thing goes last and makes the response data, which is handed up the middleware stack (reverse of given order)
  makeTheRequest
])

doTheThing({ url: '/foo' })
```

## api

### `composeMiddleware(arrayOfMiddleware)`

### `middleware`

```js
(context, next) => next(context).then(result => result)
```

#### `context`

`context` is whatever data that is passed into the composed middleware function (1st and only argument). It is passed to middleware in the order the middleware was given. The value of `context` for each middleware is the value that the previous middleware passed into `next(context)`.

#### `result`

`result` is the value resolved from the promise of the last middleware. Keep in mind that results are handled in reverse order of how the middleware are given. It's intuitive if you read the middleware:

```js
next(context).then( // call the next given middleware, then do something with its result
  result => // result resolved from the next given middleware
    'foo' // result from this middleware, which can be handled by the middleware given above this one
)
```
