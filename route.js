/* Copyright 2017 Ronny Reichmann */
/* ROUTE Define route-change events. */

const Route = require('route-parser')
const pipe = require('./pipe')
const jsonic = require('jsonic')
const { context, circular, send } = require('./T')
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
const ctx = context()

function retrieveWindow () {
  return pipe(resolve => {
    send('type: teth-globals, retrieve: window-object')
      .then(win => { resolve(win) })
      .catch(() => { resolve(window) })
  })
}

function route (description, ...args) {
  if (args.length === 2) {
    return composeStateMutatingRoute(description, args[0], args[1])
  } else if (args.length === 1) {
    return composeMessagingRoute(description, args[0])
  } else {
    throw new Error('Call route(...) either with (<description>, <pattern>) or (<description>, <middleware>, <routine>)')
  }
}
route.change = (...routeComponents) => {
  retrieveWindow()
    .then(win => {
      win.location.hash = routeComponents.join('')
    })
    .catch(console.error)
}

function composeRouteBase (description, hitCallback) {
  retrieveWindow()
    .then(win => {
      const matcher = new Route(description)
      function onChange () {
        const routeString = win.location.href.slice(win.location.origin.length)
        const params = matcher.match(routeString)
        if (params) hitCallback(params)
      }
      win.addEventListener('load', onChange)
      win.addEventListener('hashchange', onChange)
    })
    .catch(console.error)
  const composit = {
    route: (subDescription, ...args) => {
      const fullSubDescription = description + subDescription
      return route(fullSubDescription, ...args)
    }
  }
  return Object.freeze(composit)
}
function composeStateMutatingRoute (description, middleware, routine) {
  const pattern = { type: 'route', description }
  ctx.define(pattern, middleware, routine)
  return composeRouteBase(description, params => {
    ctx.send(Object.assign({ params }, pattern))
      .catch(error => {
        console.error('Route error:', error)
      })
  })
}
function composeMessagingRoute (description, pattern) {
  pattern = immutableLiteral(pattern)
  return composeRouteBase(description, params => {
    circular(Object.assign({ params }, pattern))
      .catch(error => {
        console.error('Route error:', error)
      })
  })
}

module.exports = route
