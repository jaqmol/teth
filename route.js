/* Copyright 2017 Ronny Reichmann */
/* ROUTE Define route-change events. */

const Route = require('route-parser')
const pipe = require('./pipe')
const jsonic = require('jsonic')
const { context, circular, send } = require('./T')
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
const ctx = context('teth-route-private')
const stateMutationCtx = context('teth-route')

let attachRouteChangeEventListenersIfPossible = () => {
  if (!process.browser) return
  const processChangeEvent = () => {
    const path = window.location.href.slice(window.location.origin.length)
    ctx.circular({ type: 'route-private', event: 'change', path })
  }
  window.addEventListener('load', processChangeEvent)
  window.addEventListener('hashchange', processChangeEvent)
  attachRouteChangeEventListenersIfPossible = undefined
}
attachRouteChangeEventListenersIfPossible()

function route (description, ...args) {
  if (args.length === 2) {
    return composeStateMutatingRoute(description, args[0], args[1])
  } else if (args.length === 1) {
    return composeMessagingRoute(description, args[0])
  } else if (args.length === 0) {
    return composeMessagingRoute(description, 'route: unknown')
  } else {
    throw new Error('Call route(...) either with (<description>[, <pattern>]) or (<description>, <middleware>, <routine>)')
  }
}
route.change = process.browser
  ? (...routeComponents) => {
    window.location.hash = routeComponents.join('')
  }
  : (...routeComponents) => {
    const path = routeComponents.join('')
    ctx.circular({ type: 'route-private', event: 'change', path })
  }
if (!process.browser) {
  route.handler = (request, response, next) => {
    ctx.circular({
      type: 'route-private',
      event: 'change',
      path: request.url,
      server: { request, response, next }
    })
  }
}

function composeStateMutatingRoute (description, middleware, routine) {
  const pattern = Object.freeze({ type: 'route', description })
  stateMutationCtx.define(pattern, middleware, routine)
  return composeHandler(description, pattern, stateMutationCtx.circular)
}
function composeMessagingRoute (description, pattern) {
  pattern = immutableLiteral(pattern)
  return composeHandler(description, pattern, circular)
}
function composeHandler (description, pattern, circularFn) {
  const matcher = new Route(description)
  ctx.define('type: route-private, event: change', msg => {
    const params = matcher.match(msg.path)
    if (params) {
      // console.log('msg:', msg)
      const extension = { params, server: msg.server }
      const message = Object.assign({}, pattern, extension)
      circularFn(message)
        .catch(error => {
          const failMessage = {
            type: 'teth-valet',
            fail: 'not-found',
            server: msg.server
          }
          send(failMessage)
        })
    }
  })
  return childRoute(description)
}
function childRoute (parentDescription) {
  return Object.freeze({
    route: (childDescription, ...args) => {
      const fullDescription = parentDescription + childDescription
      return route(fullDescription, ...args)
    }
  })
}

module.exports = route
