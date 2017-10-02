/* Copyright 2017 Ronny Reichmann */
/* ROUTE Define route-change events. */
/* eslint-disable */

const Route = require('route-parser')
const jsonic = require('jsonic')
const { define, context, circular } = require('teth/T') // ./T
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
const ctx = context()

let windowLocation = () => window.location
let addWindowEventListener = window.addEventListener

function route (description, ...args) {
  if (args.length === 2) {
    return composeStateMutatingRoute(description, args[0], args[1])
  } else if (args.length === 1) {
    return composeMessagingRoute(description, args[0])
  } else {
    throw new Error('Call route(...) either with (<description>, <pattern>) or (<description>, <middleware>, <routine>)')
  }
}
route.change = (...pathComponents) => {
  windowLocation().hash = pathComponents.join('')
}
route.__mockWindow = mockWindow => {
  windowLocation = () => mockWindow.location
  addWindowEventListener = mockWindow.addEventListener
}

function composeRouteBase (description, hitCallback) {
  const matcher = new Route(description)
  function onChange () {
    const location = windowLocation()
    const routeString = location.href.slice(location.origin.length)
    const params = matcher.match(routeString)
    if (params) hitCallback(params)
  }
  addWindowEventListener('load', onChange)
  addWindowEventListener('hashchange', onChange)
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
