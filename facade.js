/* Copyright 2017 Ronny Reichmann */
/* SISTER is teth's Single Immutable State TREe */

const snabbdom = require('snabbdom')
const snabbdomPatch = snabbdom.init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/attributes'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/eventlisteners')
])
const h = require('snabbdom/h')
const { send, define } = require('./T')

function toSnabbdomVirtualDOM (state /* virtual element state */) {
  if (state.name) {
    const fullSelector = state.name + (state.selector || '')
    const args = [fullSelector]
    if (state.data) args.push(state.data)
    if (state.content) {
      if (typeof state.content === 'string') {
        args.push(state.content)
      } else if (state.content instanceof Array) {
        args.push(state.content.map(toSnabbdomVirtualDOM))
      }
    }
    return h.apply(h, args)
  } else return state // string contents
}

function composeFacade (elementSelector, startRenderMessage, renderViewMessage) {
  let lastVirtualDOM
  define(startRenderMessage, () => {
    const virtualElement = send(renderViewMessage)
    const virtualDOM = toSnabbdomVirtualDOM(virtualElement._state())
    const subject = lastVirtualDOM || document.querySelector(elementSelector)
    snabbdomPatch(subject, virtualDOM)
    lastVirtualDOM = virtualDOM
  })
}

module.exports = composeFacade
