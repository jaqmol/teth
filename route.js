/* Copyright 2017 Ronny Reichmann */
/* ROUTE Define route-change events. */

const Route = require('route-parser')
const jsonic = require('jsonic')
const { context, circular } = require('./T')
const immutableLiteral = lit => Object.freeze(typeof lit === 'string' ? jsonic(lit) : lit)
const ctx = context()

let windowLocation = () => {
  return window.location
}
let addWindowEventListener = window.addEventListener

function route (description, pattern) {
  pattern = immutableLiteral(pattern)
  if (arguments.length === 3) {
    const parentDescription = arguments[2]
    description = parentDescription + description
  }
  const matcher = new Route(description)
  function onChange () {
    const location = windowLocation()
    const routeString = location.href.slice(location.origin.length)
    const finding = matcher.match(routeString)
    if (finding) {
      circular(Object.assign(finding, pattern))
        .catch(error => {
          console.error('Route error:', error)
        })
    }
  }
  // addWindowEventListener('load', onChange)
  addWindowEventListener('hashchange', onChange)
  ctx.define(pattern, msg => {
    const location = windowLocation()
    const routeString = matcher.reverse(msg)
    location.href = location.origin + routeString
  })
  const composit = {
    route: (subDescription, subPattern) => route(subDescription, subPattern, description)
  }
  return Object.freeze(composit)
}
route.change = ctx.send
route.__mockWindow = mockWindow => {
  windowLocation = () => mockWindow.location
  addWindowEventListener = mockWindow.addEventListener
}

module.exports = route
