/* Copyright 2017 Ronny Reichmann */
/* CESTRE is teth's [CE]ntralised [S]tate [TRE]e */
/* Inspired by Flux and Redux */

const objectPath = require('object-path')
const { circular } = require('./T')
const pipe = require('./pipe')

const cestre = (() => {
  const allStateTrees = {}
  function getCreateStateTree () {
    if (!arguments.length) return getCreateStateTree('main')
    const name = arguments[0]
    if (!allStateTrees[name]) {
      allStateTrees[name] = composeCestreMiddleware(name)
    }
    return allStateTrees[name]
  }
  getCreateStateTree.init = function () {
    if (!arguments.length) throw new Error('No initial state provided')
    else if (arguments.length === 1) {
      return getCreateStateTree.init('main', arguments[0])
    }
    const name = arguments[0]
    const initialStateValue = arguments[1]
    const state = getCreateStateTree(name)
    state.init(initialStateValue)
    return state
  }
  getCreateStateTree.didChangePattern = Object.freeze({
    type: 'state-tree',
    event: 'did-change'
  })
  return getCreateStateTree
})()

function composeCestreMiddleware (name) {
  let stateTree
  const circularPattern = Object.assign({ name }, cestre.didChangePattern)
  let openMutations = 0
  let mutationsCount = 0
  function retrieveValue (keypath) {
    return objectPath.get(stateTree, keypath)
  }
  function replaceValue (keypath, value) {
    objectPath.set(stateTree, keypath, value)
    return keypath
  }
  function state (...allStringKeypaths) {
    const allKeypaths = allStringKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      const originals = allKeypaths.map(retrieveValue)
      return next(message, ...originals)
    }
  }
  state.init = function (initialStateTree) {
    if (stateTree) throw new Error('Multiple state tree initializations')
    stateTree = initialStateTree
  }
  state.mutate = function (...allStringKeypaths) {
    const allKeypaths = allStringKeypaths.map(kp => kp.split('.'))
    return function middleware (message, next) {
      openMutations += 1
      const originals = allKeypaths.map(retrieveValue)
      const rawResult = next(message, ...originals)
      if (!rawResult) throw new Error('Mutation must have a return value')
      const result = rawResult.then ? rawResult : pipe.resolve(rawResult)
      return result.then(changes => {
        if (changes.length !== originals.length) {
          throw new Error(`Returned array must contain ${originals.length} value(s) for key path(s) ${allStringKeypaths.join(', ')}`)
        }
        const keypaths = allKeypaths
          .map((kp, idx) => ({
            path: kp,
            original: originals[idx],
            change: changes[idx]
          }))
          .filter(({ original, change }) => original !== change)
          .map(({ path, change }) => replaceValue(path, change))
        openMutations -= 1
        mutationsCount += keypaths.length
        if ((openMutations === 0) && (mutationsCount > 0)) {
          circular(Object.assign({ keypaths }, circularPattern))
        }
      })
    }
  }
  return state
}

module.exports = cestre
